defmodule ChatAppWeb.RoomChannel do
  use Phoenix.Channel
  alias ChatAppWeb.Presence

  @impl true
  def join("room:lobby", _params, socket) do
    send(self(), :after_join)
    
    # Load previous messages
    messages = 
      ChatApp.get_messages()
      |> Enum.map(fn message -> 
        user = ChatApp.get_user(message.user_id)
        %{
          content: message.content,
          username: user.username,
          timestamp: message.inserted_at
        } 
      end)
    
    {:ok, %{messages: messages}, socket}
  end

  @impl true
  def handle_info(:after_join, socket) do
    # Get the username from socket
    username = socket.assigns.user.username
    
    # Track user presence
    {:ok, _} = Presence.track(socket, username, %{
      online_at: inspect(System.system_time(:second))
    })
    
    # Push presences to the client
    push(socket, "presence_state", Presence.list(socket))
    {:noreply, socket}
  end

  @impl true
  def handle_in("new_msg", %{"content" => content}, socket) do
    user = socket.assigns.user

    case ChatApp.create_message(%{content: content, user_id: user.id}) do
      {:ok, message} ->
        broadcast!(socket, "new_msg", %{
          content: message.content,
          username: user.username,
          timestamp: message.inserted_at
        })
        {:reply, :ok, socket}

      {:error, _changeset} ->
        {:reply, {:error, %{reason: "Failed to create message"}}, socket}
    end
  end

  @impl true
  def handle_in("user_typing", %{"username" => username}, socket) do
    broadcast!(socket, "user_typing", %{
      username: username
    })
    {:reply, :ok, socket}
  end
end