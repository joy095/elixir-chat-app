defmodule ChatAppWeb.UserSocket do
  use Phoenix.Socket

  # A Socket handler
  #
  # It's a good idea to have this file highlight a few things to the developer 
  # as the first place they interact with channels and sockets.
  #
  # Socket params are passed from the client and can
  # be used to verify and authenticate a user. After
  # verification, you can put default assigns into
  # the socket that will be set for all channels, ie
  #
  #     {:ok, assign(socket, :user_id, verified_user_id)}
  #
  # To deny connection, return `:error`.
  #
  # See `Phoenix.Token` documentation for examples in
  # performing token verification on connect.
  @impl true
  def connect(%{"username" => username} = params, socket, _connect_info) do
    IO.puts("Connect attempt with params: #{inspect(params)}")
    
    case ChatApp.get_user_by_username(username) do
      nil ->
        # User doesn't exist, let's create one
        IO.puts("Creating new user: #{username}")
        case ChatApp.create_user(%{username: username}) do
          {:ok, user} ->
            IO.puts("User created successfully: #{inspect(user)}")
            {:ok, assign(socket, :user, user)}
          {:error, changeset} ->
            IO.puts("Failed to create user: #{inspect(changeset)}")
            :error
        end
      user ->
        # User exists, assign to socket
        IO.puts("User found: #{inspect(user)}")
        {:ok, assign(socket, :user, user)}
    end
  end

  def connect(_params, _socket, _connect_info), do: :error

  # Socket id's are topics that allow you to identify all sockets for a given user:
  #
  #     def id(socket), do: "user_socket:#{socket.assigns.user_id}"
  #
  # Would allow you to broadcast a "disconnect" event and terminate
  # all active sockets and channels for a given user:
  #
  #     Elixir.ChatAppWeb.Endpoint.broadcast("user_socket:#{user.id}", "disconnect", %{})
  #
  # Returning `nil` makes this socket anonymous.
  @impl true
  def id(socket), do: "user_socket:#{socket.assigns.user.id}"

  ## Channels
  # Define channel routes here. See `phoenix/guides/channels.md` for guides.
  channel "room:*", ChatAppWeb.RoomChannel
end