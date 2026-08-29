import { test } from 'node:test'
import assert from 'node:assert/strict'
import { QUIZZES, quizBlock } from '../scripts/quiz.mjs'
import { LEARN_TOPICS } from '../scripts/learn-kit.mjs'

test('every question has exactly one correct answer', () => {
  for (const [slug, questions] of Object.entries(QUIZZES)) {
    for (const [i, q] of questions.entries()) {
      const right = q.options.filter((o) => o.correct)
      assert.equal(right.length, 1, `${slug} q${i + 1}: ${right.length} correct answers`)
    }
  }
})

test('every option explains itself, including the wrong ones', () => {
  // The explanation under a wrong answer is the most valuable text in the
  // block: a plausible wrong answer is usually somebody's working model, and
  // naming why it fails is the whole job. An option without one is a bug.
  for (const [slug, questions] of Object.entries(QUIZZES)) {
    for (const [i, q] of questions.entries()) {
      for (const o of q.options) {
        assert.ok(o.why && o.why.trim().length > 20,
          `${slug} q${i + 1} "${o.text}": missing or thin explanation`)
      }
    }
  }
})

test('questions have enough options to be worth answering', () => {
  for (const [slug, questions] of Object.entries(QUIZZES)) {
    for (const [i, q] of questions.entries()) {
      assert.ok(q.options.length >= 3, `${slug} q${i + 1}: only ${q.options.length} options`)
    }
  }
})

test('the correct answer is not always in the same place', () => {
  // A quiz whose answer is always first is a quiz you can pass without
  // reading. Across the whole bank the correct index should vary.
  const positions = new Set()
  for (const questions of Object.values(QUIZZES)) {
    for (const q of questions) positions.add(q.options.findIndex((o) => o.correct))
  }
  assert.ok(positions.size >= 3, `correct answer only ever appears at ${[...positions].join(', ')}`)
})

test('every quiz belongs to a real explainer', () => {
  const slugs = new Set(LEARN_TOPICS.map((t) => t.slug))
  for (const slug of Object.keys(QUIZZES)) {
    assert.ok(slugs.has(slug), `quiz for "${slug}" has no matching explainer`)
  }
})

test('no option text is duplicated within a question', () => {
  for (const [slug, questions] of Object.entries(QUIZZES)) {
    for (const [i, q] of questions.entries()) {
      const texts = q.options.map((o) => o.text.toLowerCase())
      assert.equal(new Set(texts).size, texts.length, `${slug} q${i + 1} repeats an option`)
    }
  }
})

test('renders nothing for a slug with no questions', () => {
  assert.equal(quizBlock((s) => s, 'not-a-real-slug'), '')
})

test('rendered markup wires each option to its own explanation', () => {
  const html = quizBlock((s) => s, 'dmx')
  const buttons = [...html.matchAll(/aria-describedby="(qw-\d+-\d+)"/g)].map((m) => m[1])
  const explanations = [...html.matchAll(/<p class="qwhy" id="(qw-\d+-\d+)"/g)].map((m) => m[1])
  assert.ok(buttons.length > 0)
  assert.deepEqual(buttons, explanations, 'every button must point at its own explanation')
  // Explanations start hidden; nothing is given away before an answer.
  assert.equal((html.match(/class="qwhy"[^>]*hidden/g) ?? []).length, explanations.length)
})

test('the correct answer is not discoverable from the markup alone', () => {
  // data-correct has to be in the DOM for the check to work without a server,
  // which means a determined reader can find it. What must NOT happen is the
  // correct option being marked in a way that renders differently before an
  // answer - that would give it away visually.
  const html = quizBlock((s) => s, 'power')
  assert.ok(html.includes('data-correct="1"'))
  assert.ok(!/class="qopt[^"]*correct/.test(html), 'no class distinguishes the right answer')
})
