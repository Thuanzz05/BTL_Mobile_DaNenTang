import 'dotenv/config';
import app from './app';
import pool, { testConnection } from './config/database';
import { JwtUtil } from './utils/jwt.util';

async function start() {
  JwtUtil.validateConfig();
  await testConnection();
  const port = Number(process.env.PORT || 5000);
  const server = app.listen(port, () =>
    console.log(`Backend đang chạy tại http://localhost:${port}`)
  );
  const shutdown = () => {
    server.close(() => {
      void pool.end().then(() => process.exit(0));
    });
    setTimeout(() => {
      server.closeAllConnections();
    }, 5000).unref();
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
  server.on('error', (error) => {
    console.error(error);
    void pool.end();
    process.exitCode = 1;
  });
}
start().catch((error) => {
  console.error('Không thể khởi động backend:', error.message);
  void pool.end();
  process.exitCode = 1;
});
