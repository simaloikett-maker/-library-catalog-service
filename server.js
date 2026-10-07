const { app, connectDatabase } = require('./app');

const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Library catalog API running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
