# Distran — AI Unit Project · Speaker Script

**What this is:** the actual words to say, one block per slide. Written the way you'd say it out loud, not the way you'd write it down — so read it a few times, then put it away and talk.

**Length:** Hussein 2:50 · Alvin 2:50 · Issa 2:25. Total just over eight minutes, which leaves the Q&A pages plenty of room.

| Part | Speaker | Slides | Section | Target |
|---|---|---|---|---|
| 01 | **Hussein** · 169183 | 1–10 | Introduction — why we chose what we chose | 2:50 |
| 02 | **Alvin** · 167602 | 11–17 | Methodology — how we trained it | 2:50 |
| 03 | **Issa** · 190003 | 18–25 | Results — what came out, what we learned | 2:25 |
| 04 | All three | — | Questions — rehearse the two Q&A sections at the back | 5:00 |

---

# 01 · Hussein — 169183

*Introduction · slides 1–10 · about 2:50*

**Slide 1 — Cover**

> Hi — I'm Hussein, and this is Alvin and Issa. We built the learning model behind Distran, an app that keeps films, TV and games in one place. I'll cover why, Alvin covers training, Issa covers results.

**Slide 2 — The goal**

> First, what's wrong today. Your home feed is ranked by weights we picked by hand — same formula for everybody. So someone who's rated a hundred things and someone who signed up ten minutes ago get roughly the same order. We wanted a feed that picks up your patterns, and it has to learn from ratings you give on purpose, because we have no scroll logs.

**Slide 3 — The goal, animated**

> Every rating lands in a profile that's yours — older ones keep a long-term weight, recent ones pull harder, both fade. And it stays on your machine.

**Slide 4 — Where we started**

> We started with the obvious thing: Bayesian personalised ranking on a public Amazon dataset — sixty-six thousand ratings, twenty-four thousand works. It learns from pairs: this person preferred A over B. It lost to plain popularity. Which makes sense — five ratings a person isn't enough pairs, and popularity is a strong guess. So collaborative weight went to zero.

**Slide 5 — Previous iterations and learnings**

> Three lessons. A proxy dataset exists, so we can measure offline. Popularity beats pairwise learning when data is this thin. And predicting public score from text works — 0.67 error — but that's what everybody thinks, not what you think.

**Slide 6 — Why this approach**

> So the model is small: shared weights that everybody's ratings train, plus a private correction only your ratings move. An adaptive preference classifier. It fits what we've got: a few ratings per person, brand-new works, no impression data. Ada-Pref's idea, applied per user.

**Slide 7 — Pipeline**

> Where it sits: candidates from the live catalogue, hard filters remove what's ineligible, the classifier scores, diversity reorders, your rating feeds back. And that bottom line matters — it only reorders cards that already passed. It can't add, hide or fetch anything.

**Slide 8 — What we chose to do**

> One question, per person, answered before we see the truth: would this person rate this four or more? One rating, one label. And unrated stays missing — never a dislike. That's where small recommenders usually go wrong.

**Slide 9 — How it becomes a classifier**

> Four steps: history becomes thirteen numbers, they get weighted and summed, a sigmoid squashes that into a probability, the probability becomes an order. Three outputs — yes or no, probability, ranking — each measured its own way.

**Slide 10 — The classifier, animated**

> That's the loop: features in, probability out, order changes, rating comes back. Alvin will open it up.

---

# 02 · Alvin — 167602

*Methodology · slides 11–17 · about 2:50*

**Slide 11 — The model in one formula**

> This is the whole model, left to right. A probability that you say yes; the sigmoid that turns any score into a probability; a global bias, the baseline for everybody; shared weights over the thirteen features; your private correction. Multiply those by your feature vector and you have a score. The line underneath is the learning — nudge your correction in the direction that would have cut the error, then clip it, so one rating can't rewrite who you are.

**Slide 12 — The 13 features**

> Thirteen bounded numbers: the work, the format, you, and the fit between you and the work. All computed as of the moment of the rating, so the model physically can't see what happens after the thing it's predicting.

**Slide 13 — The model, animated**

> It predicts, the rating arrives, the error moves your weights a little, the next prediction is better. On the left, the clipping — why one five-star can't take over. On the right, why a new user still gets something sensible: the shared weights carry what we learned from everybody, and your correction only bends them.

**Slide 14 — The text encoders**

> Where the numbers come from: the texts get encoded. What ships is TF-IDF — term frequency, inverse document frequency — then singular value decomposition, fitted on twenty thousand documents. It runs in milliseconds on a CPU, which is exactly why it's the one in the app. The CNN and the mini-GPT are separate experiments, written from scratch in NumPy and gradient-checked, each against a deliberately dumb baseline — because a score with nothing to compare it to tells you nothing.

**Slide 15 — Encoders, animated**

> Left: a three-word window slides across a description and pools into a score bucket — the CNN. Right: the mini-GPT predicting each next word, and the useful side effect is the embedding, the representation that makes those predictions possible. Perplexity — how surprised it is — went from 2,047 down to 34.7.

**Slide 16 — Training and evaluation**

> We split chronologically, sixty-twenty-twenty, so the test set is genuinely the future rather than a random slice of the past. Fit on train only, settings from validation, test read once. And five hypotheses written down before that read, because it's very easy to look at a number and invent the story that fits it.

**Slide 17 — Training, animated**

> Train on the past, tune in the middle, test locked until the final pass. Ten checkpointed stages, a hundred and eighty-seven seconds on a Colab CPU, a hash of every input. Issa has what came out.

---

# 03 · Issa — 190003

*Results · slides 18–25 · about 2:25*

**Slide 18 — Predictions**

> Five things we said would happen, written down before we looked. Two about ranking, one about the language model, one about calibration — whether our probabilities mean anything — and one about promotion, whether any of it would be allowed into the app.

**Slide 19 — Actual outcomes**

> Prediction improved: log loss 2.729 to 1.746, about a thirty-six per cent cut, and calibration improved with it. The mini-GPT went from 2,047 perplexity down to 34.7. Ranking didn't move — a tie, 0.0010 both ways. Promotion held, so nothing was promoted. Two of five confirmed, and I'd rather show you the misses than round them up. In one sentence: it learned what you like, but not yet in what order to show it. Log loss, quickly, is just the penalty for being confidently wrong.

**Slide 20 — Results, animated**

> Three panels, drawn to scale. Error down a third. Perplexity collapsing. Ranking — and that flat bar is the honest picture, not a drawing error.

**Slide 21 — Does it fit what the app needs**

> Four of the five needs are real: it predicts better than a guess, it works from a few ratings, it handles brand-new works, and it runs locally with no GPU. The miss is reordering the top ten, and that's the one a user would notice. It needs an impression ledger — which cards were shown, and which ones you skipped. Content delivery doesn't change at all: the app still indexes TMDB and IGDB and serves its own vectors.

**Slide 22 — Learnings and next steps**

> Small, online and honestly measured beat big and static at this scale, and we'd rather ship a small model we can measure than a big one we can't. A gain in prediction is not a gain in ranking — different questions, different measurements. Next is the ledger, then on-device scoring against today's ranker.

**Slide 23 — The gate**

> So the gate to the app stays shut: research stops at heldout evaluation. What opens it is catalogue identity mapping, logged impressions, and an app-side evaluation we run ourselves.

**Slide 24 — Thank you**

> Thank you — happy to take questions. It all reproduces from the repository.

**Slide 25 — Sources**

> Sources are on the last slide, and they're clickable.
---

# Questions — part 1 of 2

*Method, model, encoders, training*

> **How to answer:** name the constraint, then the choice, then the evidence. If you genuinely don't know, say what you'd measure to find out — that answer is always available and it's always honest.

## Method and model

**Why a classifier rather than a recommender?**
Because recommenders that rank learn from impressions — which cards were shown and which ones were skipped. We only have ratings. A classifier scores one candidate at a time, which is measurable with the data we actually have, and the probability still gives us an order.

**Why is the label "four or more"?**
It's the line people treat as "I'd recommend this to someone". It also gives us a workable balance of positives to negatives, and it makes the output readable — "will this person like it" rather than an abstract number.

**Why logistic regression and a sigmoid?**
The output is a probability, so we can calibrate it and threshold it. The loss is convex, so training doesn't wander, and with thirteen features the weights stay readable — we can explain why a card moved.

**Why not a gradient-boosted or neural ranker?**
With thirteen features and 303 evaluated users, more capacity buys nothing and costs interpretability. We compared against boosting on validation and it didn't separate itself, so the linear model wins on debuggability and on file size.

**What is the per-user correction, exactly?**
A small vector added to the shared weights, one slot per feature — your private deviation from the average. It lets one shared model express two people with opposite taste without retraining anything.

**Why clip it at ±10?**
Because without a cap, one five-star rating can swing a new user's scores by tens of per cent. The clip means a rating can move your profile but never rewrite it.

**Why a learning rate of 0.1 and no regularisation?**
Both came from a small grid on validation log loss. Regularisation didn't help because the features are already bounded and the correction is already clipped — the clipping is doing that job.

**Does "predict, then learn" leak the answer?**
No. The features are built strictly from events before the timestamp, the label is the current event, and the update happens after the prediction is stored. That ordering is enforced in code and covered by tests.

## Encoders and training

**Why TF-IDF and SVD in the app, but a CNN and a GPT as experiments?**
The app has no GPU, so the cheapest thing that works — a linear projection of sparse text — is the right call. The CNN and the mini-GPT answer a different question, "what would more capacity buy us", and each is measured against a trivial baseline so a win means something.

**Why is the mini-GPT so small?**
It's a capability proof on a CPU with a twenty-thousand-document corpus: two transformer blocks, forty-eight dimensions, 808,128 parameters, 1,200 Adam steps. The point was that the gradients are correct and that it beats the baseline, not that it's large.

**Why did the CNN lose to a majority baseline?**
Nine unbalanced classes, a small corpus, no pretraining. 0.536 against a 0.598 majority is exactly what an under-trained CNN looks like — and reporting it is more useful than quietly dropping it.

**Why split by title hash instead of at random?**
Because remakes, ports and editions of the same title would otherwise land on both sides of the split and flatter the score. Hash buckets keep a whole title on one side.

**Why chronological rather than random?**
The app is deployed into the future. A random split lets the model learn from later behaviour to predict earlier behaviour, and you can never reproduce that in production.

**How do we know you didn't tune on the test set?**
The hyperparameters and all five hypotheses were fixed on validation before any test score existed, and nothing was refitted afterwards. That log is in the notebook.

**What about variance?**
Single fixed split, with bootstrap intervals on every ranking row. They overlap, so we make no significance claim — and we say that on the slide rather than implying one.

---

# Questions — part 2 of 2

*Results, metrics, product limits, ethics*

## Results and metrics

**Log loss improved 36 % but NDCG@10 is a tie — how?**
Calibration improved, ordering inside the top ten didn't. The model can know how much you'll like a set of candidates without knowing which of ten near-equal cards belongs first.

**Is a ranking score of 0.0010 meaningful at all?**
No — it's close to the noise floor for this catalogue. That's why the popularity baseline is printed next to it, and why we claim nothing on that row.

**Why report a metric you failed?**
Because reordering is the need a user notices. Showing only the wins would misrepresent what shipped. A registered hypothesis that fails is a result, not an embarrassment.

**What data would move the ranking number?**
Impressions — which cards were shown, in what position, and skipped. That's the only signal that separates "didn't like it" from "never saw it", and it's first on our next steps.

**Do these numbers generalise to real users?**
Not yet. They describe 303 evaluated users, one split, and an Amazon proxy corpus. They show the method works on these snapshots, not that it works for every Distran user.

**Why 13,195 test events and 303 users?**
That's what a chronological split leaves once each user has enough history to be scored fairly. Users under the threshold are excluded rather than scored on almost nothing.

**Which result surprised you most?**
That calibration and ranking moved in opposite directions. Intuitively better predictions should order better; in a top ten of near-equal candidates, they don't.

## Product, limits and ethics

**Does any personal data leave the device?**
No. Scoring is local — the app ships one small model file and twelve curated vectors. Ratings and profiles never reach Kaggle or an inference server.

**What's the worst failure mode?**
Treating "not rated" as a dislike. We mask it explicitly; otherwise the model learns your absence rather than your taste, and quietly narrows what you're shown.

**Could this create a filter bubble, or manipulate taste?**
It can only reorder eligible cards, a diversity step runs after scoring, and the hard filters are deterministic. The only incentive it receives is your own rating.

**How is a brand-new work scored with no history?**
Its content features come from the description and metadata, so the work side exists on day one. Only the collaborative signals are empty, and those are masked rather than zeroed.

**What if a user has three ratings?**
Their correction starts near zero, so predictions fall back to the shared weights plus the work's own features — sensible, slightly generic, and it sharpens with every rating after that.

**How is any of this reproducible?**
Ten checkpointed stages, pinned NumPy 2.2.6, pandas 2.2.3 and scikit-learn 1.6.1, SHA256 hashes on every input, one 187-second Colab pass, sixteen tests.

**What would you do with two more weeks?**
Log impressions in the app, then run the on-device scorer against today's fixed-weight ranker as an A/B test on the app's own catalogue — that's the one evaluation the gate is waiting for.

**Why should we believe a project that admits a failure?**
Because the failure is specific and the fix is named. Two of five predictions confirmed, with the miss measured in the same units as the wins, is a more honest report than five green ticks.
