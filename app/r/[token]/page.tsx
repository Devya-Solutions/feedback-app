import FeedbackFlow from './feedback-flow';

export default async function FeedbackTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <FeedbackFlow token={token} />;
}
