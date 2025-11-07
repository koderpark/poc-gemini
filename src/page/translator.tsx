import { Hono } from "hono";
import type { FC } from "hono/jsx";
import { parseDocument, translateDocument } from "../app/translate.js";

const page = new Hono();

const Layout: FC = ({ children }) => {
  return (
    <html>
      <head>
        <title>Translator POC</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
      </head>
      <body>{children}</body>
    </html>
  );
};

page.get("/:code/:chapter/", async(c) => {
  const code = c.req.param("code");
  const chapter = c.req.param("chapter");
  console.log(code, chapter);
  const document = await parseDocument(`https://ncode.syosetu.com/${code}/${chapter}/`);
  const translatedDocument = await translateDocument(document);

  return c.html(
    <Layout>
      <div className="min-h-screen flex items-start bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="flex flex-col items-start justify-start p-12 w-full max-w-xl mx-auto whitespace-pre-wrap">
          <h1 className="text-4xl font-bold mb-6 text-left w-full">
            {translatedDocument.title ?? "제목"}
          </h1>
          <div className="my-6 w-full text-left">
            <p className="mb-4">{translatedDocument.chapter ?? "챕터"}</p>
          </div>
          <div className="my-6 w-full text-left">
            <p className="mb-4">
              {translatedDocument.pre_content ?? "본문 전 내용"}
            </p>
          </div>
          <div className="my-6 w-full text-left">
            <p className="mb-4">{translatedDocument.content ?? "내용"}</p>
          </div>
          <div className="my-6 w-full text-left">
            <p className="mb-4">
              {translatedDocument.post_content ?? "본문 뒷 내용"}
            </p>
          </div>
          <div className="flex items-center justify-between w-full">
            <a
              href={translatedDocument.prev_chapter ?? "#"}
              className="text-blue-600"
            >
              이전 챕터
            </a>
            <a
              href={translatedDocument.next_chapter ?? "#"}
              className="text-blue-600"
            >
              다음 챕터
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
});

export default page;