import "dotenv/config";
import app from "./app.js";
import { sequelize } from "./models/index.js";

const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established.");

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Database authentication failed. Check DB_NAME/DB_USER/DB_PASSWORD/DB_HOST/DB_PORT.");
    console.error(error?.message || error);
    process.exit(1);
  }
};

startServer();
