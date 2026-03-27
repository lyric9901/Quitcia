// src/app/onboarding/page.tsx
"use client";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    q1: "",
    q2: "",
    q3: "",
    q4: "",
    q5_usedOtherTools: "",
    q6_toolFeedback: "",
  });

  const totalSteps = 6;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
      }
    });
    return unsubscribe;
  }, [router]);

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Send data to Google Sheets API
      try {
        await fetch("/api/onboarding", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(formData),
});
        
        const data = await response.json();
        if (!response.ok) {
          console.error("Sheets API failed:", data.error);
        } else {
          console.log("Successfully saved to Sheets!");
        }
      } catch (sheetError) {
        console.error("Network error calling Sheets API:", sheetError);
      }

      // 2. Save Name to Firebase
      if (auth.currentUser) {
        await setDoc(doc(db, "users", auth.currentUser.uid), {
          name: formData.name,
        }, { merge: true });
      }
      
      // 3. Redirect to dashboard
      router.push("/dashboard");
      
    } catch (error) {
      console.error("Error submitting form", error);
      router.push("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  const OptionCard = ({ 
    label, 
    field, 
    currentValue 
  }: { 
    label: string; 
    field: "q1" | "q2" | "q3" | "q4" | "q5_usedOtherTools"; 
    currentValue: string 
  }) => {
    const isSelected = currentValue === label;
    return (
      <button
        type="button"
        onClick={() => setFormData({ ...formData, [field]: label })}
        className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
          isSelected 
            ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold shadow-sm" 
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pt-8 pb-12 px-6">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {step > 1 ? (
              <button onClick={handleBack} className="text-slate-400 hover:text-slate-600 font-medium text-sm flex items-center gap-1">
                ← Back
              </button>
            ) : (
              <div /> 
            )}
            <span className="text-xs font-bold text-slate-400 tracking-wider">
              STEP {step} OF {totalSteps}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${((step - 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Let's get to know you.</h1>
              <p className="text-slate-500 mb-8">This helps us personalize your relief strategies.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">What should we call you?</label>
                  <input 
                    type="text" 
                    placeholder="Your name"
                    value={formData.name}
                    className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 outline-none text-lg transition-colors"
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">How old are you?</label>
                  <input 
                    type="number" 
                    placeholder="Age"
                    value={formData.age}
                    className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 outline-none text-lg transition-colors"
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-2xl font-bold text-slate-800 mb-8 leading-tight">
                How long has this behavior been a loop you’ve wanted to break?
              </h1>
              <div className="space-y-3">
                <OptionCard field="q1" currentValue={formData.q1} label="Under 1 year" />
                <OptionCard field="q1" currentValue={formData.q1} label="1-3 years" />
                <OptionCard field="q1" currentValue={formData.q1} label="3-5 years" />
                <OptionCard field="q1" currentValue={formData.q1} label="5+ years" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-2xl font-bold text-slate-800 mb-8 leading-tight">
                When an urge hits, what is your current go-to move to stay grounded?
              </h1>
              <div className="space-y-3">
                <OptionCard field="q2" currentValue={formData.q2} label="Physical activity" />
                <OptionCard field="q2" currentValue={formData.q2} label="Digital distraction" />
                <OptionCard field="q2" currentValue={formData.q2} label="Mindfulness" />
                <OptionCard field="q2" currentValue={formData.q2} label="Willpower alone" />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-2xl font-bold text-slate-800 mb-8 leading-tight">
                How well does that current move actually help you manage the feeling long term?
              </h1>
              <div className="space-y-3">
                <OptionCard field="q3" currentValue={formData.q3} label="Works perfectly" />
                <OptionCard field="q3" currentValue={formData.q3} label="Helps for a while" />
                <OptionCard field="q3" currentValue={formData.q3} label="Just a distraction" />
                <OptionCard field="q3" currentValue={formData.q3} label="Rarely works" />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-2xl font-bold text-slate-800 mb-8 leading-tight">
                Let us know why you want to quit?
              </h1>
              <div className="space-y-3">
                <OptionCard field="q4" currentValue={formData.q4} label="Damaging my relationship" />
                <OptionCard field="q4" currentValue={formData.q4} label="Losing self control" />
                <OptionCard field="q4" currentValue={formData.q4} label="Affecting my productivity" />
                <OptionCard field="q4" currentValue={formData.q4} label="Other" />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-2xl font-bold text-slate-800 mb-8 leading-tight">
                Have you used other tools to help with this before?
              </h1>
              <div className="space-y-3 mb-6">
                <OptionCard field="q5_usedOtherTools" currentValue={formData.q5_usedOtherTools} label="Yes" />
                <OptionCard field="q5_usedOtherTools" currentValue={formData.q5_usedOtherTools} label="No" />
              </div>

              {formData.q5_usedOtherTools === "Yes" && (
                <div className="animate-in fade-in duration-300">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    What made other tools feel like they didn't get you?
                  </label>
                  <textarea 
                    placeholder="Type your thoughts..."
                    value={formData.q6_toolFeedback}
                    className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 outline-none text-base transition-colors min-h-[120px] resize-none"
                    onChange={(e) => setFormData({...formData, q6_toolFeedback: e.target.value})}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-8 mt-auto">
          {step < totalSteps ? (
            <button 
              onClick={handleNext}
              disabled={
                (step === 1 && (!formData.name || !formData.age)) ||
                (step === 2 && !formData.q1) ||
                (step === 3 && !formData.q2) ||
                (step === 4 && !formData.q3) ||
                (step === 5 && !formData.q4)
              }
              className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-slate-200"
            >
              Continue
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={
                !formData.q5_usedOtherTools || 
                (formData.q5_usedOtherTools === "Yes" && !formData.q6_toolFeedback.trim()) || 
                isSubmitting
              }
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-200 flex justify-center items-center gap-2"
            >
              {isSubmitting ? "Building Profile..." : "Complete Setup"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
