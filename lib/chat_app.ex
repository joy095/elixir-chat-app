defmodule ChatApp do
  @moduledoc """
  ChatApp keeps the contexts that define your domain
  and business logic.

  Contexts are also responsible for managing your data, regardless
  if it comes from the database, an external API or others.
  """

  def get_messages do
    ChatApp.Message
    |> ChatApp.Repo.all()
    |> ChatApp.Repo.preload(:user)
  end

  def create_message(attrs) do
    %ChatApp.Message{}
    |> ChatApp.Message.changeset(attrs)
    |> ChatApp.Repo.insert()
  end

  def get_user_by_username(username) do
    ChatApp.Repo.get_by(ChatApp.User, username: username)
  end

  def get_user(id) do
    ChatApp.Repo.get(ChatApp.User, id)
  end

  def create_user(attrs) do
    %ChatApp.User{}
    |> ChatApp.User.changeset(attrs)
    |> ChatApp.Repo.insert()
  end
end
