import React, { useState } from "react";
import { Star, X, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "./Button";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  revieweeId: string;
  revieweeName: string;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  revieweeId,
  revieweeName,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Por favor, selecione uma nota.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!user) throw new Error("Usuário não autenticado");

      /*
      await api.post('/reviews', {
        booking_id: bookingId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        comment,
        is_published: false,
      });
      */

      // Simulating success
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);

    } catch (err: any) {
      setError(err.message || 'Erro ao enviar avaliação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Avaliar Viagem</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <p className="text-slate-500 mb-4">
              Como foi sua experiência com{" "}
              <span className="font-bold text-slate-900">{revieweeName}</span>?
            </p>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    size={40}
                    className={`${star <= (hover || rating)
                        ? "text-amber-400 fill-current"
                        : "text-slate-200"
                      } transition-colors`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="mt-3 text-sm font-bold text-amber-600">
                {rating === 5
                  ? "Excelente!"
                  : rating === 4
                    ? "Muito bom"
                    : rating === 3
                      ? "Bom"
                      : rating === 2
                        ? "Regular"
                        : "Ruim"}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                Comentário (opcional)
              </label>
              <div className="relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte detalhes que ajudem outros membros da comunidade..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none h-32 text-sm"
                />
                <MessageSquare
                  className="absolute right-4 bottom-4 text-slate-300 pointer-events-none"
                  size={18}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
                {error}
              </div>
            )}

            <div className="flex bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
              <div className="mr-3 text-blue-500">
                <Star size={20} />
              </div>
              <p className="text-[11px] text-blue-700 leading-tight">
                **Avaliação Cega**: {revieweeName} só verá sua nota após ele
                também te avaliar ou após 14 dias. Isso garante avaliações mais
                honestas!
              </p>
            </div>
          </div>

          <div className="mt-8 flex space-x-3">
            <Button variant="outline" fullWidth onClick={onClose}>
              Cancelar
            </Button>
            <Button fullWidth disabled={loading} onClick={handleSubmit}>
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Enviar Avaliação"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
