// @/app/api/onboarding/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, age, q1, q2, q3, q4 } = body;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Append the row to Sheet1 (Change 'Sheet1' if you named your tab differently)
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A1:F1", 
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[name, age, q1, q2, q3, q4, new Date().toISOString()]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Sheets API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}