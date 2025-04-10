defmodule ChatApp.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field :username, :string
    has_many :messages, ChatApp.Message

    timestamps()
  end

  @doc false
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:username])
    |> validate_required([:username])
    |> validate_length(:username, min: 3, max: 20)
    |> unique_constraint(:username)
  end
end