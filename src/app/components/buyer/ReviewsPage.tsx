import { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { MessageSquare, Star, User, Calendar, MessageCircle, CornerDownRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function ReviewsPage() {
  const { reviews, addReview, deleteReview } = useData();
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteReview(reviewId);
        toast.success('Review deleted successfully');
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete review');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please write a review comment.');
      return;
    }

    setSubmitting(true);
    try {
      await addReview(rating, comment.trim());
      toast.success('Thank you for your review!');
      setComment('');
      setRating(5);
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="pb-10 md:pb-20">
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-6 md:p-12 rounded-b-3xl shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold mb-2">Customer Reviews</h1>
          <p className="text-green-100 text-lg opacity-90">Read what others say or share your own experience</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 grid md:grid-cols-3 gap-8">
        {/* Write a Review Section */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                Write a Review
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Overall Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="text-2xl transition-transform hover:scale-110 focus:outline-none"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= (hoverRating ?? rating)
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="comment-input" className="text-sm font-semibold text-gray-600">Your Review</label>
                  <textarea
                    id="comment-input"
                    className="w-full min-h-[120px] p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="Share your thoughts about our microgreens, packaging, delivery, or service..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-green-600 hover:bg-green-700 h-12 rounded-xl font-bold text-white transition-all shadow-md"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Reviews List Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              All Reviews ({reviews.length})
            </h2>
          </div>

          <div className="space-y-6">
            {reviews.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">No reviews yet</h3>
                <p className="text-gray-500 max-w-xs mx-auto">Be the first to share your experience with our microgreens!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <Card key={review.id} className="border-none shadow-sm rounded-2xl bg-white overflow-hidden transition-all hover:shadow-md">
                  <CardContent className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-700">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm md:text-base">{review.userName}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(review.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(review.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                            title="Delete Review (Admin Only)"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Review text */}
                    <p className="text-gray-700 text-sm md:text-base leading-relaxed pl-1">
                      "{review.comment}"
                    </p>

                    {/* Admin Reply */}
                    {review.adminReply && (
                      <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex gap-3 pl-4 mt-2">
                        <CornerDownRight className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-green-800 uppercase tracking-wider bg-green-100 px-2 py-0.5 rounded">Admin Response</span>
                            <span className="text-[10px] text-gray-400">{formatDate(review.adminReply.repliedAt)}</span>
                          </div>
                          <p className="text-gray-600 text-sm italic">
                            "{review.adminReply.replyText}"
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
