const assert = require('node:assert/strict');

// Tạo fixture phiên cũ trực tiếp: API công khai không còn cho tạo phiên tự đánh giá.
module.exports = function legacySession(connection) {
  return async function createLegacy(_method, route, body, token, expected = 201) {
    const { LearningService } = require('../dist/services/learning.service');
    const { QuizService } = require('../dist/services/quiz.service');
    const { JwtUtil } = require('../dist/utils/jwt.util');
    const user = JwtUtil.verifyAccessToken(token);
    let result;
    let status = 201;
    try {
      const quiz = route === '/api/quiz/start';
      result =
        route === '/api/learning/review/start'
          ? await LearningService.startReviewSession(user.id, body.tong_so_tu)
          : await LearningService.startSession(
              user.id,
              body.chu_de_id,
              body.tong_so_tu,
              quiz ? 'trac_nghiem' : 'danh_gia'
            );
      if (quiz) {
        await connection.execute(
          "UPDATE phien_hoc_tap SET phien_ban_thuat_toan = 'leitner-adaptive-v1' WHERE id = ?",
          [result.phien_hoc_tap_id]
        );
        result = await QuizService.getSession(user.id, result.phien_hoc_tap_id);
      }
    } catch (error) {
      status = error.statusCode || (error.name === 'ZodError' ? 400 : 500);
      result = error.message;
    }
    assert.equal(status, expected, route + ': ' + JSON.stringify(result));
    return result;
  };
};
