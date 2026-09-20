module.exports = async function migrate(connection) {
  const addColumn = async (name, definition) => {
    const [columns] = await connection.query(
      'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['thanh_tich', name]
    );
    if (!columns.length) {
      await connection.query(`ALTER TABLE thanh_tich ADD COLUMN ${name} ${definition}`);
    }
  };

  await addColumn('loai', "VARCHAR(30) NULL COMMENT 'completed_sessions, streak, learned_words'");
  await addColumn('moc', 'INT UNSIGNED NULL');

  const rules = [
    ['completed_sessions', 1, 'achv0001-0000-0000-0000-000000000001'],
    ['streak', 3, 'achv0002-0000-0000-0000-000000000002'],
    ['learned_words', 50, 'achv0003-0000-0000-0000-000000000003'],
    ['learned_words', 100, 'achv0004-0000-0000-0000-000000000004'],
  ];
  for (const [type, target, id] of rules) {
    await connection.query('UPDATE thanh_tich SET loai = ?, moc = ? WHERE id = ?', [
      type,
      target,
      id,
    ]);
  }
};
