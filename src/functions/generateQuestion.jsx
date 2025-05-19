function generateRandomQuestion() {
  const num1 = Math.floor(Math.random() * 9) + 1;
  const num2 = Math.floor(Math.random() * 9) + 1;
  const operators = ["+", "-"];
  const operator = operators[Math.floor(Math.random() * operators.length)];

  let answer;
  let questionText;

  if (operator === "+") {
    answer = num1 + num2;
    questionText = `¿Cuánto es ${num1} + ${num2}?`;
  } else {
    const [a, b] = num1 >= num2 ? [num1, num2] : [num2, num1];
    answer = a - b;
    questionText = `¿Cuánto es ${a} - ${b}?`;
  }

  return { question: questionText, answer };
}

export default generateRandomQuestion;
