import axios from "axios";

export async function POST(req) {
  try {
    const body = await req.json();
    const transcript = body.transcript;

    if (!transcript) {
      return new Response(JSON.stringify({ error: "Transcript is required" }), { status: 400 });
    }

    const prompt = `
Extract the main points from the following transcript:

${transcript}

List them as bullet points.
`;

    const res = await axios.post(
      "https://api-inference.huggingface.co/models/NousResearch/Hermes-3-Llama-3.1-8B",
      {
        inputs: prompt
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Hugging Face sometimes returns an array of objects with 'generated_text'
    const text = res.data?.[0]?.generated_text || "No summary generated";

    return new Response(
      JSON.stringify({ transcript, mainPoints: text.split("\n").filter(Boolean) }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err.response?.data || err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
