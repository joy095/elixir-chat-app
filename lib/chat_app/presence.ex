defmodule ChatApp.Presence do
  @moduledoc """
  Simple wrapper for the Phoenix Presence module.
  """

  alias ChatAppWeb.Presence, as: PhoenixPresence

  def track_user(socket, user) do
    PhoenixPresence.track(
      socket,
      user.username,
      %{
        online_at: inspect(System.system_time(:second)),
        username: user.username
      }
    )
  end

  def list_present_users do
    PhoenixPresence.list("chat_room")
    |> Enum.map(fn {username, %{metas: [meta | _]}} ->
      %{
        username: username,
        online_at: meta.online_at
      }
    end)
  end
end
