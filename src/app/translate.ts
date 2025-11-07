import { GoogleGenAI } from "@google/genai";
import * as cheerio from "cheerio";
import fs from "fs";

export type NarouDocument = {
  title: string;
  chapter: string;

  pre_content: string;
  content: string;
  post_content: string;

  prev_chapter: string | null;
  next_chapter: string | null;
}

export const parseDocument = async (url: string): Promise<NarouDocument> => {
  const response = await fetch(url);
  const document = await response.text();
  const $ = cheerio.load(document);


  const title = $("h1.p-novel__title")?.text();
  const chapter = $("div.p-novel__number")?.text();

  const pre_content = $(".p-novel__text--preface")?.text();
  const content = $(".p-novel__text").eq(1)?.text();
  const post_content = $(".p-novel__text--afterword")?.text();

  const prev_chapter = $(".c-pager__item--before")?.attr("href") ?? null;
  const next_chapter = $(".c-pager__item--next")?.attr("href") ?? null;

  return {
    title,
    chapter,
    pre_content,
    content,
    post_content,
    prev_chapter,
    next_chapter,
  };
}

export const translateDocument = async (document: NarouDocument): Promise<NarouDocument> => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI,
  });
  const prompt = fs.readFileSync("prompt.txt", "utf8");
  
  // 전체 문서를 번역하고 JSON 형식으로 반환하도록 프롬프트 확장
  const systemPrompt = `${prompt}`;

  // JSON Schema 정의 (structured output을 위한 스키마)
  const responseSchema = {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Translated title in Korean"
      },
      chapter: {
        type: "string",
        description: "Translated chapter in Korean"
      },
      pre_content: {
        type: "string",
        description: "Translated pre_content in Korean"
      },
      content: {
        type: "string",
        description: "Translated content in Korean"
      },
      post_content: {
        type: "string",
        description: "Translated post_content in Korean"
      },
      prev_chapter: {
        type: ["string", "null"],
        description: "Previous chapter URL (unchanged)"
      },
      next_chapter: {
        type: ["string", "null"],
        description: "Next chapter URL (unchanged)"
      }
    },
    required: ["title", "chapter", "pre_content", "content", "post_content", "prev_chapter", "next_chapter"]
  };

  const response = await ai.models.generateContent({
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
    model: "gemini-2.5-flash",
    contents: [JSON.stringify(document, null, 2)],
  });
  
  // structured output을 사용하면 응답이 직접 JSON으로 반환됨
  const responseText = response.text?.trim();
  if (!responseText) {
    console.error("No response text from API");
    return document;
  }
  
  try {
    const translatedDoc = JSON.parse(responseText) as NarouDocument;

    // 타입 검증 및 반환
    return {
      title: translatedDoc.title || document.title,
      chapter: translatedDoc.chapter || document.chapter,
      pre_content: translatedDoc.pre_content || document.pre_content,
      content: translatedDoc.content || document.content,
      post_content: translatedDoc.post_content || document.post_content,
      prev_chapter: document.prev_chapter, // URL은 변경하지 않음
      next_chapter: document.next_chapter, // URL은 변경하지 않음
    };
  } catch (error) {
    // JSON 파싱 실패 시 원본 문서 반환
    console.error("Failed to parse translation response:", error);
    console.error("Response text:", responseText);
    return document;
  }
}