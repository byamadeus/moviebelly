import './GenreCard.css';

interface GenreCardProps {
  id: number;
  name: string;
  onClick: () => void;
}

const GenreCard = ({ name, onClick }: GenreCardProps) => {
  return (
    <button className="genre-card" onClick={onClick}>
      <span className="genre-card__name">{name}</span>
      <svg
        className="genre-card__icon"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.5 15L12.5 10L7.5 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default GenreCard;
