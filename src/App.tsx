import './App.css';
import importedQuestionList from './questions/list.json';
import { useState } from 'react';
import Modal from './modal/Modal';
import './modal/Modal.css';

type ChoiceList = { a: string, b: string, c: string, d: string };
type AvailableChoices = 'a' | 'b' | 'c' | 'd';
type AnswerObject = { id: string, answer: AvailableChoices };
type AnswerArray = AnswerObject[];
type QuestionItem = {
  id: string,
  question: string,
  choices: {
    answer: AvailableChoices,
    list: ChoiceList,
    order?: AvailableChoices[]
  }
};

type LeaderboardData = { username: string, score: number, maxScore: number };
type LeaderboardDataWithTime = { value: LeaderboardData, timestamp: number }

const questionList = importedQuestionList as QuestionItem[];
const totalQS = 20;
const totalTopScores = 10;
let shuffledQSList: QuestionItem[] = [];
let leaderboard: LeaderboardDataWithTime[] = [];

function Question({qsNumber, qsTitle}: {qsNumber: number, qsTitle: string}) {
  return (
    <>
      <span className="question-prefix">{'Question ' + qsNumber.toString() + ': '}</span>
      {qsTitle}
    </>
  );
}

function Answers({ qsData, choices, handleAction }:
  { qsData: QuestionItem, choices: AvailableChoices[], handleAction: Function }
) {
  const showingChoices = ['A', 'B', 'C', 'D'];
  let elements: any[] = [];

  choices.forEach((eachChoices, index) => {
    elements.push(
      <p key={'answer-' + index}>
        <input type='radio' name={qsData.id} onClick={() => handleAction(qsData.id, eachChoices)}/>
        {showingChoices[index]}: {qsData.choices.list[eachChoices]}
      </p>
    );
  });

  return (
    <>
      {elements}
    </>
  );
}

function App() {
  function storeQSAns(qsNumber: string, choice: AvailableChoices) {
    const answerIndex = answers.findIndex((eachAnswer: AnswerObject) => eachAnswer.id === qsNumber);
    let storage: AnswerArray = answers.slice();

    if (answerIndex === -1) {
      storage.push({ id: qsNumber, answer: choice });
    } else {
      storage[answerIndex] = { id: qsNumber, answer: choice };
    }

    setAnswer(storage);
  }

  function processQSAns() {
    let result = { correct: 0, incorrect: 0 };
    let showResult = false;
    let question: QuestionItem | undefined;

    if (answers.length === totalQS) {
      for (let index = 0; index < answers.length; index++) {
        if (!answers[index]) {
          showSubmitError();
          break;
        }

        question = questionList.find(qs => qs.id === answers[index].id);
        if (question) question.choices.answer === answers[index].answer ? result.correct++ : result.incorrect++;
        if (index + 1 === totalQS) showResult = true;
      }

      if (showResult) {
        const username = prompt(`You answered ${result.correct} question(s) correctly, ${result.incorrect} question(s) wrong`, 'John Doe');
        submitScore({
          username: username ? username: '(No Name)',
          score: result.correct,
          maxScore: totalQS
        });
      }
    } else {
      showSubmitError();
    }
  }

  function showSubmitError() {
    console.warn(`[WARNING] Please answer all ${totalQS} questions before submitting!`);
    alert(`Please answer all ${totalQS} questions before submitting!`);
  }

  function submitScore(data: LeaderboardData) {
    localStorage.setItem((new Date().getTime()).toString(), JSON.stringify(data));
    leaderboard = [];
  }

  function processLeaderboard() {
    let topScores: LeaderboardDataWithTime[] = [];
    let data: LeaderboardDataWithTime;
    let score = { lowest: -1, highest: -1, lastIndex: -1 };
    let elements: React.JSX.Element[] = [];

    if (leaderboard.length <= 0) {
      Object.keys(localStorage).sort((a: string, b: string) => parseInt(b) - parseInt(a))
      .forEach(key => {
        data = {
          value: JSON.parse(localStorage[key]),
          timestamp: parseInt(key)
        };

        if (score.highest === -1 && score.lowest === -1) {
          score.highest = data.value.score;
          score.lowest = data.value.score;
          topScores.push(data);
        } else if (data.value.score > score.highest) {
          score.highest = data.value.score;
          topScores.unshift(data);
        } else if (data.value.score < score.lowest) {
          score.lowest = data.value.score;
          topScores.push(data);
        } else {
          topScores.splice(findLastIndexForLeaderboard(topScores, data), 0, data);
        }

        score.lastIndex = data.value.score;
      });
      leaderboard = topScores;
    }

    if (leaderboard.length > 0) {
      for (let index = 0; index < totalTopScores; index++) {
        if (leaderboard[index]) {
          elements.push(
            <tr key={'leaderboard-' + index} className='leaderboard'>
              <td>#{ index + 1 }</td>
              <td>{ leaderboard[index].value.username }</td>
              <td>{ leaderboard[index].value.score + ' / ' + leaderboard[index].value.maxScore }</td>
              <td>{ getLeaderboardDatetime(new Date(leaderboard[index].timestamp)) }</td>
            </tr>
          );
        }
      }
    } else {
      elements.push(<p key={'leaderboard-no-data'} className='center'>(No Data)</p>);
    }

    return leaderboard.length > 0 ? (
      <>
        <h2>Leaderboard</h2>
        <table>
          <thead>
            <tr>
              <th>Ranking</th>
              <th>Name</th>
              <th>Score</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>{ elements }</tbody>
        </table>
      </>
    ) : (<><h2>Leaderboard</h2>{elements}</>);
  }

  function findLastIndexForLeaderboard(
    leaderboardData: LeaderboardDataWithTime[], data: LeaderboardDataWithTime
  ): number {
    let lastIndex = -1;
    let scoreGroup = data.value.score - 1;
    for (scoreGroup; scoreGroup >= -1; scoreGroup--) {
      lastIndex = findLastIndexScoreGroup(leaderboardData, scoreGroup);
      if (lastIndex !== -1) break;
    }

    if (lastIndex === -1) lastIndex = leaderboardData.length;

    return lastIndex;
  }

  function findLastIndexScoreGroup(data: LeaderboardDataWithTime[], scoreGroup: number): number {
    return data.findIndex(topScore => topScore.value.score === scoreGroup);
  }

  function getLeaderboardDatetime(dateTime: Date): string {
    return `${dateTime.getFullYear()}/${formatDate(dateTime.getMonth())}/${formatDate(dateTime.getDate())} ${formatDate(dateTime.getHours())}:${formatDate(dateTime.getMinutes())}:${formatDate(dateTime.getSeconds())}`
  }

  function formatDate(incomingValue: number): string {
    return incomingValue >= 10 ? incomingValue.toString() : '0' + incomingValue.toString() ;
  }

  function shuffle(incomingArray: any[]): any[] {
    let currentIndex = incomingArray.length;
    while (currentIndex !== 0) {
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [incomingArray[currentIndex], incomingArray[randomIndex]] = [
        incomingArray[randomIndex], incomingArray[currentIndex]
      ];
    }

    return incomingArray;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////

  const [modalOpen, setModalOpen] = useState(false);
  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const [answers, setAnswer] = useState<AnswerArray>([]);
  if (shuffledQSList.length <= 0) {
    shuffledQSList = shuffle(questionList);
  }

  let questionsArray: React.JSX.Element[] = [];
  let shuffledChoices: AvailableChoices[] = [];
  for (let index = 0; index < totalQS; index++) {
    if (shuffledQSList[index]?.choices?.order &&
      Array.isArray(shuffledQSList[index].choices.order)
    ) {
      shuffledChoices = shuffledQSList[index].choices.order as AvailableChoices[];
    } else {
      shuffledChoices = shuffle(Object.keys(shuffledQSList[index].choices.list));
      shuffledQSList[index].choices.order = shuffledChoices;
    }

    questionsArray.push(
      <div key={'app-section' + index} className='question-body'>
        <Question qsNumber={index + 1} qsTitle={shuffledQSList[index].question}/>
        <Answers qsData={shuffledQSList[index]} choices={shuffledChoices} handleAction={storeQSAns} />
      </div>
    );
  }

  return (
    <div className="App">
      <div className="menu top">
        <span className="title">Welcome to The impossible {totalQS}!</span>
        <button className="Submit-btn" type="button" onClick={openModal}>Leaderboard</button>
      </div>
      <div className="question-section">
        {questionsArray}
      </div>
      <div className="menu bottom">
        <button className="Submit-btn" type="button" onClick={() => processQSAns()}>Click to Submit!</button>
      </div>
      <Modal isOpen={modalOpen} onClose={closeModal} children={processLeaderboard()}/>
    </div>
  );
}

export default App;
