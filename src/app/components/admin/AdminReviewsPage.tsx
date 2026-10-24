import { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Star, User, Calendar, MessageSquare, Reply, CornerDownRight, Check, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function AdminReviewsPage() {
  const { reviews, replyToReview, deleteReview } = useData();
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Calculate statistics
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Are you sure you want to delete this user review? This action cannot be undone.')) {
      try {
        await deleteReview(reviewId);
        toast.success('Review deleted successfully');
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete review');
      }
    }
  };

  const handleReplySubmit = async (reviewId: string) => {
    if (!replyText.trim()) {
      toast.error('Reply text cannot be empty');
      return;
    }

    setSubmitting(true);
    try {
      await replyToReview(reviewId, replyText.trim());
      toast.success('Reply submitted successfully');
      setActiveReplyId(null);
      setReplyText('');
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartReply = (reviewId: string, existingText = '') => {
    setActiveReplyId(reviewId);
    setReplyText(existingText);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="pb-10 md:pb-20">
      <div className="bg-gradient-to-br from-green-700 to-emerald-800 text-white p-6 md:p-12 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold mb-2">Manage Reviews</h1>
            <p className="text-green-100 text-lg opacity-90">View user feedback and write official replies</p>
          </div>
          {/* Stats Badges */}
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-center">
              <p className="text-xs uppercase tracking-wider text-green-200">Total Reviews</p>
              <p className="text-3xl font-extrabold">{totalReviews}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-center">
              <p className="text-xs uppercase tracking-wider text-green-200">Average Rating</p>
              <p className="text-3xl font-extrabold flex items-center justify-center gap-1">
                {averageRating}
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 shrink-0" />
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-green-700" />
          User Feedback ({reviews.length})
        </h2>

        <div className="space-y-6">
          {reviews.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-200">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No reviews found</h3>
              <p className="text-gray-500 max-w-xs mx-auto">There are no user reviews to manage at the moment.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} className="border-none shadow-sm rounded-2xl bg-white overflow-hidden transition-all hover:shadow-md">
                <CardContent className="p-6 space-y-4">
                  {/* User info header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-700 shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{review.userName}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {/* Stars & Delete Action */}
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
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(review.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Delete Review"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed pl-1">
                    "{review.comment}"
                  </p>

                  {/* Reply section / reply preview */}
                  {review.adminReply && activeReplyId !== review.id ? (
                    <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 space-y-2 mt-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <CornerDownRight className="w-4 h-4 text-green-600 shrink-0" />
                          <span className="text-xs font-bold text-green-850 uppercase tracking-wider bg-green-100 px-2 py-0.5 rounded">Your Response</span>
                          <span className="text-[10px] text-gray-400">{formatDate(review.adminReply.repliedAt)}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-xs text-green-700 hover:text-green-800"
                          onClick={() => handleStartReply(review.id, review.adminReply?.replyText)}
                        >
                          Edit Reply
                        </Button>
                      </div>
                      <p className="text-gray-600 text-sm pl-6 italic">
                        "{review.adminReply.replyText}"
                      </p>
                    </div>
                  ) : activeReplyId === review.id ? (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 mt-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <Reply className="w-4 h-4 text-green-600 shrink-0" />
                        <span>Writing Response</span>
                      </div>
                      <textarea
                        className="w-full min-h-[80px] p-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        placeholder="Write your response to this customer..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 px-3 rounded-lg text-gray-500"
                          onClick={() => {
                            setActiveReplyId(null);
                            setReplyText('');
                          }}
                        >
                          <X className="w-4 h-4 mr-1" /> Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          disabled={submitting}
                          className="h-9 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold"
                          onClick={() => handleReplySubmit(review.id)}
                        >
                          <Check className="w-4 h-4 mr-1" /> Submit Reply
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-xl border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 flex items-center gap-2"
                        onClick={() => handleStartReply(review.id)}
                      >
                        <Reply className="w-4 h-4" />
                        Reply to Review
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
