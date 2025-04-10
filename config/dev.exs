import Config

# Configure your database
config :chat_app, ChatApp.Repo,
  username: System.get_env("PGUSER") || "postgres",
  password: System.get_env("PGPASSWORD") || "admin123",
  hostname: System.get_env("PGHOST") || "localhost",
  database: System.get_env("PGDATABASE") || "chat_app",
  port: String.to_integer(System.get_env("PGPORT") || "5432"),
  url: System.get_env("DATABASE_URL"),
  ssl: false,
  # ssl: true,
  ssl_opts: [verify: :verify_none],
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 20

# For development, we disable any cache and enable
# debugging and code reloading.
config :chat_app, ChatAppWeb.Endpoint,
  http: [ip: {0, 0, 0, 0}, port: 5000],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "lK+qDjAJ2rFBVVmBMOWLFjh56gRDSeZADGWDrV1OTJSsiFvyZSgAk4u4JBPGzl7P",
  watchers: [
    esbuild: {Esbuild, :install_and_run, [:default, ~w(--sourcemap=inline --watch)]}
  ]

# Watch static and templates for browser reloading
config :chat_app, ChatAppWeb.Endpoint,
  live_reload: [
    patterns: [
      ~r"priv/static/.*(js|css|png|jpeg|jpg|gif|svg)$",
      ~r"priv/gettext/.*(po)$",
      ~r"lib/chat_app_web/(live|views)/.*(ex)$",
      ~r"lib/chat_app_web/templates/.*(eex)$"
    ]
  ]

# Do not include metadata nor timestamps in development logs
config :logger, :console, format: "[$level] $message\n"

# Set a higher stacktrace during development
config :phoenix, :stacktrace_depth, 20

# Initialize plugs at runtime for faster development compilation
config :phoenix, :plug_init_mode, :runtime
