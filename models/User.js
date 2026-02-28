class User {
  constructor({ id, name, surname, email, password, rol, status, created_at }) {
    this.id = id;
    this.name = name;
    this.surname = surname;
    this.email = email;
    this.password = password;
    this.rol = rol;
    this.status = status;
    this.created_at = created_at;
  }
}

module.exports = User;
