import { runCodeWithJudge0 } from "../services/judge0Service.js";

export async function runCode(req, res, next) {
  try {
    const result = await runCodeWithJudge0(req.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}
