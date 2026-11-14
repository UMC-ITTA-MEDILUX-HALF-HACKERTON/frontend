import { z } from "zod";

// 백엔드 응답과 폼 입력을 검증한다. 필드 이름은 백엔드 명세에 맞춰 고친다.
export const exampleSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
});

export const exampleListSchema = z.array(exampleSchema);

export const createExampleSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(50, "50자 이하로 입력해 주세요."),
});
