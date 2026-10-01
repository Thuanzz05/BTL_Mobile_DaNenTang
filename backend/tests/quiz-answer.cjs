module.exports = async function quizAnswer(connection, questionId, correct = true) {
  const [[question]] = await connection.execute(
    `SELECT loai_cau_hoi, lua_chon, dap_an_dung_id, dap_an_dung_text
     FROM cau_hoi_trac_nghiem WHERE id = ?`,
    [questionId]
  );

  if (question.loai_cau_hoi === 'nhap-tu') {
    return { cau_tra_loi: correct ? question.dap_an_dung_text : '__sai__' };
  }

  const options =
    typeof question.lua_chon === 'string' ? JSON.parse(question.lua_chon) : question.lua_chon;
  return {
    lua_chon_id: correct
      ? question.dap_an_dung_id
      : options.find((option) => option.id !== question.dap_an_dung_id).id,
  };
};
