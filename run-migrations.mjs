#!/usr/bin/env node

import mysql from 'mysql2/promise';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

async function runMigrations() {
  let connection;
  try {
    // Parse DATABASE_URL
    const url = new URL(connectionString);
    const config = {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: url.port || 3306,
    };

    connection = await mysql.createConnection(config);
    console.log('Connected to database');

    // Check if numberOfTrials column exists
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'calls' AND COLUMN_NAME = 'numberOfTrials'`
    );

    if (columns.length === 0) {
      console.log('Adding numberOfTrials column...');
      
      // First check if clinic column exists and drop it
      const [clinicColumns] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_NAME = 'calls' AND COLUMN_NAME = 'clinic'`
      );
      
      if (clinicColumns.length > 0) {
        await connection.query('ALTER TABLE `calls` DROP COLUMN `clinic`');
        console.log('Dropped clinic column');
      }
      
      // Add numberOfTrials column
      await connection.query(
        'ALTER TABLE `calls` ADD COLUMN `numberOfTrials` int NOT NULL DEFAULT 1'
      );
      console.log('Added numberOfTrials column');
    } else {
      console.log('numberOfTrials column already exists');
    }

    console.log('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigrations();
