# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#
# Inside the script, you can read and write to any of your
# repositories directly:
#
#     ChatApp.Repo.insert!(%ChatApp.SomeSchema{})
#
# We recommend using the bang functions (`insert!`, `update!`
# and so on) as they will fail if something goes wrong.

alias ChatApp.{User, Message, Repo}

# Get or create users
alice = case ChatApp.get_user_by_username("alice") do
  nil -> 
    {:ok, user} = ChatApp.create_user(%{username: "alice"})
    user
  user -> user
end

bob = case ChatApp.get_user_by_username("bob") do
  nil -> 
    {:ok, user} = ChatApp.create_user(%{username: "bob"})
    user
  user -> user
end

charlie = case ChatApp.get_user_by_username("charlie") do
  nil -> 
    {:ok, user} = ChatApp.create_user(%{username: "charlie"})
    user
  user -> user
end

# Only create messages if there aren't any yet
if Enum.empty?(ChatApp.get_messages()) do
  IO.puts("Creating sample messages...")
  
  # Create some sample messages
  ChatApp.create_message(%{content: "Hello, everyone!", user_id: alice.id})
  ChatApp.create_message(%{content: "Hi Alice, how are you?", user_id: bob.id})
  ChatApp.create_message(%{content: "I'm good, thanks for asking!", user_id: alice.id})
  ChatApp.create_message(%{content: "Hey everyone, just joined the chat!", user_id: charlie.id})
  ChatApp.create_message(%{content: "Welcome Charlie!", user_id: bob.id})
end