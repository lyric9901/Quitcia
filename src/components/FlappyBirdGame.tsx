import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';
import { X, RotateCcw, Trophy } from 'lucide-react-native';
import { getItemSync, setItemSync } from '../lib/localStore';

interface FlappyBirdGameProps {
  visible: boolean;
  onClose: () => void;
}

interface Pipe {
  x: number;
  top: number;
  bottom: number;
  passed: boolean;
}

const GAME_WIDTH = 300;
const GAME_HEIGHT = 320;

export const FlappyBirdGame: React.FC<FlappyBirdGameProps> = ({ visible, onClose }) => {
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);

  const [birdY, setBirdY] = useState(150);
  const [pipes, setPipes] = useState<Pipe[]>([]);

  const stateRef = useRef({
    birdY: 150,
    velocity: 0,
    gravity: 0.35,
    jump: -6,
    pipes: [] as Pipe[],
    score: 0,
    running: false,
  });

  useEffect(() => {
    const saved = getItemSync('flappy_highscore');
    if (saved) setHighScore(parseInt(saved, 10) || 0);
  }, []);

  const startGame = () => {
    stateRef.current = {
      birdY: 160,
      velocity: -4,
      gravity: 0.35,
      jump: -6,
      pipes: [
        { x: 320, top: 100, bottom: 110, passed: false },
        { x: 500, top: 130, bottom: 90, passed: false },
      ],
      score: 0,
      running: true,
    };
    setScore(0);
    setBirdY(160);
    setPipes(stateRef.current.pipes);
    setGameState('PLAYING');
  };

  const handleTap = () => {
    if (stateRef.current.running) {
      stateRef.current.velocity = stateRef.current.jump;
    } else if (gameState !== 'PLAYING') {
      startGame();
    }
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      const state = stateRef.current;
      if (!state.running) return;

      // Gravity & position update
      state.velocity += state.gravity;
      state.birdY += state.velocity;

      // Pipe movement & score tracking
      state.pipes.forEach((p) => {
        p.x -= 2.2;
        if (p.x < 50 && !p.passed) {
          p.passed = true;
          state.score += 1;
          setScore(state.score);
        }
      });

      // Spawn new pipes
      if (state.pipes.length > 0 && state.pipes[state.pipes.length - 1].x < 180) {
        const topH = Math.floor(Math.random() * 130) + 40;
        const gap = 110;
        state.pipes.push({
          x: 340,
          top: topH,
          bottom: GAME_HEIGHT - topH - gap,
          passed: false,
        });
      }

      // Remove off-screen pipes
      if (state.pipes.length > 0 && state.pipes[0].x < -50) {
        state.pipes.shift();
      }

      // Collision checks
      if (state.birdY > GAME_HEIGHT - 20 || state.birdY < 0) {
        state.running = false;
        setGameState('GAMEOVER');
        const nextHigh = Math.max(state.score, highScore);
        setHighScore(nextHigh);
        setItemSync('flappy_highscore', nextHigh.toString());
        return;
      }

      state.pipes.forEach((p) => {
        if (p.x < 70 && p.x + 40 > 50) {
          if (state.birdY < p.top || state.birdY + 20 > GAME_HEIGHT - p.bottom) {
            state.running = false;
            setGameState('GAMEOVER');
            const nextHigh = Math.max(state.score, highScore);
            setHighScore(nextHigh);
            setItemSync('flappy_highscore', nextHigh.toString());
          }
        }
      });

      setBirdY(state.birdY);
      setPipes([...state.pipes]);

      timer = setTimeout(loop, 1000 / 60);
    };

    loop();
    return () => clearTimeout(timer);
  }, [gameState, highScore]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={{ fontSize: 18 }}>🐤</Text>
              <Text style={styles.headerTitle}>Flappy Urge Wave</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Scoreboard */}
          <View style={styles.scoreboard}>
            <Text style={styles.scoreText}>
              Score: <Text style={{ color: '#2DD4BF', fontWeight: '900' }}>{score}</Text>
            </Text>
            <View style={styles.bestRow}>
              <Trophy size={14} color="#FBBF24" />
              <Text style={styles.bestText}>
                Best: <Text style={{ color: '#FBBF24', fontWeight: '900' }}>{highScore}</Text>
              </Text>
            </View>
          </View>

          {/* Game Area */}
          <Pressable onPress={handleTap} style={styles.gameContainer}>
            {/* Pipes */}
            {pipes.map((p, idx) => (
              <React.Fragment key={idx}>
                {/* Top Pipe */}
                <View
                  style={[
                    styles.pipe,
                    { left: p.x, top: 0, height: p.top, width: 40 },
                  ]}
                />
                {/* Bottom Pipe */}
                <View
                  style={[
                    styles.pipe,
                    { left: p.x, bottom: 0, height: p.bottom, width: 40 },
                  ]}
                />
              </React.Fragment>
            ))}

            {/* Bird */}
            <View style={[styles.bird, { top: birdY - 10 }]} />

            {/* Overlays */}
            {gameState === 'IDLE' && (
              <View style={styles.overlayTextContainer}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🐤</Text>
                <Text style={styles.idleTitle}>Tap to Fly</Text>
                <Text style={styles.idleSub}>Dodge urge obstacles!</Text>
              </View>
            )}

            {gameState === 'GAMEOVER' && (
              <View style={styles.overlayTextContainer}>
                <Text style={styles.gameOverTitle}>Wave Crashed!</Text>
                <Text style={styles.gameOverScore}>Score: {score}</Text>
                <Pressable onPress={startGame} style={styles.replayBtn}>
                  <RotateCcw size={14} color="white" />
                  <Text style={styles.replayBtnText}>Play Again</Text>
                </Pressable>
              </View>
            )}
          </Pressable>

          <Text style={styles.hintText}>Tap anywhere on screen to flap. Focus your mind!</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#0F172A',
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '900',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#1E293B',
  },
  scoreboard: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#070D1B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 12,
  },
  scoreText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  bestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bestText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  gameContainer: {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#070D1B',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#0D948833',
    position: 'relative',
  },
  bird: {
    position: 'absolute',
    left: 50,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    borderWidth: 2,
    borderColor: 'white',
  },
  pipe: {
    position: 'absolute',
    backgroundColor: '#0D9488',
    borderRadius: 4,
  },
  overlayTextContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  idleTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  idleSub: {
    color: '#94A3B8',
    fontSize: 12,
  },
  gameOverTitle: {
    color: '#F87171',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  gameOverScore: {
    color: '#E2E8F0',
    fontSize: 13,
    marginBottom: 12,
  },
  replayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#0D9488',
  },
  replayBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 13,
  },
  hintText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 12,
    textAlign: 'center',
  },
});
