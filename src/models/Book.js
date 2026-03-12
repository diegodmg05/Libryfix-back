class Book {
  constructor({ id, title, author, description, price, stock, image_url, category_id, status, created_at }) {
    this.id = id;
    this.title = title;
    this.author = author;
    this.description = description;
    this.price = price;
    this.stock = stock;
    this.image_url = image_url;
    this.category_id = category_id;
    this.status = status;
    this.created_at = created_at;
  }
}

module.exports = Book;
