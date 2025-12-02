
type Book = {
  id: number
  title: string
  author: string
  year: number | null
  coverUrl: string
}

type Props = {
  book: Book
}

export default function BookCard({ book }: Props) {
  return (
    <article className="book-card">
      <div className="book-card-image-wrapper">
        <img src={book.coverUrl} alt={book.title} className="book-card-image" />
      </div>
      <div className="book-card-body">
        <h3 className="book-card-title">{book.title}</h3>
        <p className="book-card-author">{book.author}</p>
        <p className="book-card-year">{book.year}</p>
        <button className="book-card-button">View & Download</button>
      </div>
    </article>
  )
}
