module.exports = {
  apps: [
    {
      name: "store",
      cwd: "/var/www/store",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3045",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3045,
      },
      max_memory_restart: "1G",
    },
  ],
};
