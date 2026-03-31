// src/app/api/onboarding/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, age, q1, q2, q3, q4, q5_usedOtherTools, q6_toolFeedback } = body;

    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
      console.error("CRITICAL: Missing Google Environment Variables");
      return NextResponse.json({ error: "Server configuration missing" }, { status: 500 });
    }

    // 🟢 THE ULTIMATE PRIVATE KEY FIX 🟢
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    
    // 1. Remove surrounding quotes if Vercel added them
    privateKey = privateKey.replace(/^"|"$/g, '');
    
    // 2. Fix literal \n characters to be actual multi-line breaks
    privateKey = privateKey.split('\\n').join('\n');
    
    // 3. Clean up any accidental leading/trailing whitespace
    privateKey = privateKey.trim();

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:I", 
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[
          name || "", 
          age || "", 
          q1 || "", 
          q2 || "", 
          q3 || "", 
          q4 || "", 
          q5_usedOtherTools || "No",
          q6_toolFeedback || "",     
          new Date().toISOString()
        ]],
      },
    });

    return NextResponse.json({ success: true, updatedRows: response.data.updates?.updatedRows });
  } catch (error: any) {
    console.error("Sheets API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}