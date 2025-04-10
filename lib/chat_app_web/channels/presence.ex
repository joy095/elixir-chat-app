defmodule ChatAppWeb.Presence do
  @moduledoc """
  Provides presence tracking for channels and processes.

  See the Phoenix.Presence documentation for more details.
  """
  use Phoenix.Presence, 
    otp_app: :chat_app,
    pubsub_server: ChatApp.PubSub
end