import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Trophy, Star, CheckCircle, XCircle, Brain, 
  Zap, Clock, ChevronRight, Award, Target
} from 'lucide-react';
import toast from 'react-hot-toast';

const quizQuestions = [
  {
    id: 1,
    question: "What does SBM stand for in India's sanitation initiative?",
    options: [
      "Swachh Bharat Mission",
      "Sanitation Board of Ministry",
      "Safe Building Movement",
      "State Bathroom Management"
    ],
    correct: 0,
    xp: 10,
    category: "Civic Knowledge"
  },
  {
    id: 2,
    question: "Which Article of the Indian Constitution guarantees Right to Clean Environment?",
    options: [
      "Article 14",
      "Article 19",
      "Article 21",
      "Article 32"
    ],
    correct: 2,
    xp: 15,
    category: "Constitutional Rights"
  },
  {
    id: 3,
    question: "What is the toll-free number for filing complaints in India?",
    options: [
      "100",
      "1800-111-555",
      "181",
      "112"
    ],
    correct: 2,
    xp: 10,
    category: "Civic Services"
  },
  {
    id: 4,
    question: "Which ministry handles the PRAJA portal?",
    options: [
      "Ministry of Urban Development",
      "Ministry of Housing and Urban Affairs",
      "Ministry of Environment",
      "Ministry of Health"
    ],
    correct: 1,
    xp: 15,
    category: "Government Structure"
  },
  {
    id: 5,
    question: "What percentage of solid waste should be segregated at source as per guidelines?",
    options: [
      "50%",
      "75%",
      "100%",
      "25%"
    ],
    correct: 2,
    xp: 10,
    category: "Waste Management"
  },
];

export default function QuizScreen({ onBack }) {
  const [gameState, setGameState] = useState('intro'); // intro, playing, result
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [earnedXP, setEarnedXP] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [streak, setStreak] = useState(0);

  const question = quizQuestions[currentQuestion];

  const handleAnswer = (index) => {
    if (showResult) return;
    
    setSelectedAnswer(index);
    setShowResult(true);

    const isCorrect = index === question.correct;
    
    if (isCorrect) {
      const bonusXP = streak >= 2 ? 5 : 0; // Streak bonus
      setScore(prev => prev + 1);
      setEarnedXP(prev => prev + question.xp + bonusXP);
      setStreak(prev => prev + 1);
      toast.success(`+${question.xp + bonusXP} XP${bonusXP > 0 ? ' (Streak bonus!)' : ''}`, { icon: '🎉' });
    } else {
      setStreak(0);
    }

    setAnswers(prev => [...prev, { questionId: question.id, selected: index, correct: question.correct, isCorrect }]);

    // Next question after delay
    setTimeout(() => {
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setGameState('result');
      }
    }, 1500);
  };

  const restartQuiz = () => {
    setGameState('intro');
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setEarnedXP(0);
    setAnswers([]);
    setStreak(0);
  };

  // Intro screen
  const renderIntro = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center"
    >
      <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
        <Brain className="text-white" size={48} />
      </div>
      
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Civic Quiz</h1>
      <p className="text-gray-500 mb-8">Test your knowledge about civic rights and responsibilities</p>

      <div className="w-full max-w-sm space-y-4 mb-8">
        <div className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <Star className="text-amber-500" size={24} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800">Earn up to 70 XP</p>
            <p className="text-sm text-gray-500">Answer correctly to earn points</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Zap className="text-purple-500" size={24} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800">Streak Bonuses</p>
            <p className="text-sm text-gray-500">3+ correct = +5 bonus XP</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Target className="text-emerald-500" size={24} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800">{quizQuestions.length} Questions</p>
            <p className="text-sm text-gray-500">Multiple choice format</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setGameState('playing')}
        className="w-full max-w-sm py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition-opacity"
      >
        Start Quiz
      </button>
    </motion.div>
  );

  // Quiz playing screen
  const renderPlaying = () => (
    <div className="p-6">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-500">
            Question {currentQuestion + 1} of {quizQuestions.length}
          </span>
          <div className="flex items-center gap-2">
            {streak >= 2 && (
              <span className="px-2 py-1 bg-amber-100 text-amber-600 rounded-full text-xs font-bold flex items-center gap-1">
                <Zap size={12} /> {streak} Streak!
              </span>
            )}
            <span className="text-sm font-bold text-indigo-600">{earnedXP} XP</span>
          </div>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Category tag */}
      <div className="mb-4">
        <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-xs font-medium">
          {question.category}
        </span>
      </div>

      {/* Question */}
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8"
      >
        <h2 className="text-xl font-bold text-gray-800 leading-relaxed">
          {question.question}
        </h2>
      </motion.div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => {
          let bgColor = 'bg-white hover:bg-gray-50';
          let borderColor = 'border-gray-200';
          let icon = null;

          if (showResult) {
            if (index === question.correct) {
              bgColor = 'bg-green-50';
              borderColor = 'border-green-500';
              icon = <CheckCircle className="text-green-500" size={24} />;
            } else if (index === selectedAnswer && index !== question.correct) {
              bgColor = 'bg-red-50';
              borderColor = 'border-red-500';
              icon = <XCircle className="text-red-500" size={24} />;
            }
          } else if (selectedAnswer === index) {
            bgColor = 'bg-indigo-50';
            borderColor = 'border-indigo-500';
          }

          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleAnswer(index)}
              disabled={showResult}
              className={`w-full p-4 rounded-xl border-2 text-left flex items-center justify-between transition-all ${bgColor} ${borderColor}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  selectedAnswer === index && !showResult
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="font-medium text-gray-800">{option}</span>
              </div>
              {icon}
            </motion.button>
          );
        })}
      </div>

      {/* XP preview */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Worth <span className="font-bold text-indigo-600">{question.xp} XP</span>
      </div>
    </div>
  );

  // Result screen
  const renderResult = () => {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    let grade, gradeColor, message;
    
    if (percentage >= 80) {
      grade = 'A+'; gradeColor = 'text-green-500'; message = 'Outstanding! You\'re a Civic Champion!';
    } else if (percentage >= 60) {
      grade = 'B'; gradeColor = 'text-blue-500'; message = 'Great job! Keep learning!';
    } else if (percentage >= 40) {
      grade = 'C'; gradeColor = 'text-amber-500'; message = 'Good effort! There\'s room to grow.';
    } else {
      grade = 'D'; gradeColor = 'text-red-500'; message = 'Keep practicing! You\'ll improve.';
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center"
      >
        {/* Trophy animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-xl"
        >
          <Trophy className="text-white" size={64} />
        </motion.div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz Complete!</h1>
        <p className="text-gray-500 mb-6">{message}</p>

        {/* Stats */}
        <div className="w-full max-w-sm grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className={`text-3xl font-bold ${gradeColor}`}>{grade}</p>
            <p className="text-xs text-gray-500">Grade</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-3xl font-bold text-gray-800">{score}/{quizQuestions.length}</p>
            <p className="text-xs text-gray-500">Correct</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-3xl font-bold text-indigo-600">+{earnedXP}</p>
            <p className="text-xs text-gray-500">XP Earned</p>
          </div>
        </div>

        {/* XP earned animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-sm bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Total XP Earned</p>
              <p className="text-4xl font-bold">+{earnedXP}</p>
            </div>
            <Award size={48} className="text-white/30" />
          </div>
        </motion.div>

        {/* Actions */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={restartQuiz}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={onBack}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Civic Quiz</h1>
          <p className="text-xs text-white/70">Learn & Earn XP</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {gameState === 'intro' && renderIntro()}
          {gameState === 'playing' && renderPlaying()}
          {gameState === 'result' && renderResult()}
        </AnimatePresence>
      </div>
    </div>
  );
}
