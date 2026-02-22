document.addEventListener('DOMContentLoaded', () => {

    const elements = {
        canvas: document.getElementById('spinWheel'),
        spinBtn: document.getElementById('spinBtn'),
        withdrawBtn: document.getElementById('withdrawBtn'),
        headerWithdraw: document.getElementById('headerWithdraw'),
        balanceValue: document.getElementById('balanceValue'),
        toast: document.getElementById('toast'),
        // Modal elements
        modal: document.getElementById('gameModal'),
        gameName: document.getElementById('gameName'),
        gameTimer: document.getElementById('gameTimer'),
        gameScore: document.getElementById('gameScore'),
        gameContainer: document.getElementById('gameContainer'),
        resultArea: document.getElementById('gameResultArea'),
        resultTitle: document.getElementById('resultTitle'),
        resultMsg: document.getElementById('resultMsg'),
        redeemBtn: document.getElementById('redeemBtn'),
        tryAgainBtn: document.getElementById('tryAgainBtn')
    };

    let state = {
        balance: 0,
        ang: 0,
        angVel: 0,
        gameActive: false,
        gameType: null,
        score: 0,
        timer: 0,
        loop: null,
        gameData: {}
    };

    // --- Spin Wheel ---
    const sectors = [
        { label: "₹1", color: "#166534" }, { label: "₹10", color: "#1e1e1e" },
        { label: "₹100", color: "#166534" }, { label: "₹1000", color: "#fbbf24" },
        { label: "₹1000", color: "#166534" }, { label: "Try Again", color: "#1e1e1e" }
    ];

    if (elements.canvas) {
        const ctx = elements.canvas.getContext('2d');
        const tot = sectors.length;
        const rad = elements.canvas.width / 2;
        const TAU = 2 * Math.PI;
        const arc = TAU / tot;

        const drawSector = (sector, i) => {
            const angle = arc * i;
            ctx.save();
            ctx.beginPath();
            ctx.fillStyle = sector.color;
            ctx.moveTo(rad, rad);
            ctx.arc(rad, rad, rad, angle, angle + arc);
            ctx.lineTo(rad, rad);
            ctx.fill();
            ctx.translate(rad, rad);
            ctx.rotate(angle + arc / 2);
            ctx.textAlign = "right";
            ctx.fillStyle = "#fff";
            if (sector.label === "₹1000") ctx.fillStyle = "#000";
            ctx.font = "bold 18px Outfit";
            ctx.fillText(sector.label, rad - 15, 7);
            ctx.restore();
        };

        const spinEngine = () => {
            if (state.angVel > 0.002) {
                state.angVel *= 0.985;
                state.ang += state.angVel;
                state.ang %= TAU;
                elements.canvas.style.transform = `rotate(${state.ang - Math.PI / 2}rad)`;
                requestAnimationFrame(spinEngine);
            } else {
                state.angVel = 0;
                elements.spinBtn.disabled = false;
                const index = Math.floor(tot - (state.ang / TAU) * tot) % tot;
                handleSpinResult(sectors[index].label);
            }
        };

        const handleSpinResult = (label) => {
            if (label !== "Try Again") {
                const amt = parseInt(label.replace('₹', ''));
                state.balance += amt;
                elements.balanceValue.innerText = `₹${state.balance}`;
                elements.withdrawBtn.style.display = "block";
                elements.headerWithdraw.style.display = "block";
                showToast(`Won ${label}!`);
            } else {
                showToast("Try Again!");
            }
        };

        elements.spinBtn.onclick = () => {
            if (state.angVel > 0) return;
            elements.spinBtn.disabled = true;
            state.angVel = Math.random() * (0.45 - 0.35) + 0.35;
            spinEngine();
        };

        sectors.forEach(drawSector);
    }

    // --- 12 Grames Logic ---
    const GAMES_CONFIG = {
        rocketDodge: { name: "Rocket Dodge", reward: 500, time: 20, goal: 50 },
        neonJump: { name: "Neon Jumper", reward: 1000, time: 25, goal: 10 },
        reflexTap: { name: "Color Reflex", reward: 2000, time: 15, goal: 20 },
        fruitTap: { name: "Fruit Tap", reward: 1500, time: 20, goal: 30 },
        mathLink: { name: "Math Link", reward: 2500, time: 30, goal: 10 },
        colorMatch: { name: "Color Logic", reward: 5000, time: 20, goal: 15 },
        flashRecall: { name: "Flash Cards", reward: 3000, time: 30, goal: 5 },
        matchPair: { name: "Pair Finder", reward: 4000, time: 40, goal: 6 },
        quickQuiz: { name: "Fast Trivia", reward: 1000, time: 25, goal: 8 },
        wordGuess: { name: "Word Master", reward: 2000, time: 30, goal: 5 },
        brickHit: { name: "Brick Break", reward: 3500, time: 40, goal: 20 },
        invader: { name: "Invader", reward: 5000, time: 35, goal: 100 }
    };

    window.openGame = (type) => {
        state.gameType = type;
        const config = GAMES_CONFIG[type];
        elements.gameName.innerText = config.name;
        elements.modal.style.display = 'flex';
        initGame(type);
    };

    window.restartGame = () => {
        initGame(state.gameType);
    };

    window.closeGameModal = () => {
        stopGame();
        elements.modal.style.display = 'none';
    };

    const initGame = (type) => {
        stopGame();
        state.gameActive = true;
        state.score = 0;
        state.timer = GAMES_CONFIG[type].time;
        elements.resultArea.style.display = 'none';
        elements.gameContainer.innerHTML = '';
        updateScore();
        updateTimerDisplay();

        // Start countdown
        state.loop = setInterval(() => {
            state.timer--;
            updateTimerDisplay();
            if (state.timer <= 0) endGame(false);
        }, 1000);

        // Load specific game UI
        loadGameModule(type);
    };

    const stopGame = () => {
        state.gameActive = false;
        clearInterval(state.loop);
        if (state.gameData.aniId) cancelAnimationFrame(state.gameData.aniId);
        state.gameData = {};
    };

    const updateScore = () => {
        const goal = GAMES_CONFIG[state.gameType].goal;
        elements.gameScore.innerText = `Score: ${state.score} / Goal: ${goal}`;
        if (state.score >= goal) endGame(true);
    };

    const updateTimerDisplay = () => {
        elements.gameTimer.innerText = `Time: ${state.timer}s`;
    };

    const endGame = (win) => {
        stopGame();
        elements.resultArea.style.display = 'flex';
        const config = GAMES_CONFIG[state.gameType];
        if (win) {
            elements.resultTitle.innerText = "YOU WON!";
            elements.resultTitle.style.color = "var(--accent-green)";
            elements.resultMsg.innerText = `Reward: ₹${config.reward}`;
            elements.redeemBtn.style.display = 'block';
            elements.tryAgainBtn.style.display = 'none';
        } else {
            elements.resultTitle.innerText = "FAILED!";
            elements.resultTitle.style.color = "var(--accent-red)";
            elements.resultMsg.innerText = "Better luck next time!";
            elements.redeemBtn.style.display = 'none';
            elements.tryAgainBtn.style.display = 'block';
        }
    };

    const loadGameModule = (type) => {
        const container = elements.gameContainer;
        container.style.position = 'relative';

        switch (type) {
            case 'rocketDodge':
                container.innerHTML = '<canvas id="gc" width="300" height="300"></canvas>';
                const cvsD = document.getElementById('gc');
                const ctxD = cvsD.getContext('2d');
                state.gameData = { p: 140, obs: [] };
                const loopD = () => {
                    if (!state.gameActive) return;
                    ctxD.clearRect(0, 0, 300, 300);
                    ctxD.fillStyle = '#4ade80'; ctxD.fillRect(state.gameData.p, 260, 20, 20);
                    if (Math.random() < 0.04) state.gameData.obs.push({ x: Math.random() * 280, y: 0 });
                    state.gameData.obs.forEach((o, i) => {
                        o.y += 3; ctxD.fillStyle = '#ff4500'; ctxD.fillRect(o.x, o.y, 20, 20);
                        if (o.y > 300) { state.gameData.obs.splice(i, 1); state.score++; updateScore(); }
                        if (o.y > 240 && o.x < state.gameData.p + 20 && o.x + 20 > state.gameData.p) endGame(false);
                    });
                    state.gameData.aniId = requestAnimationFrame(loopD);
                };
                cvsD.ontouchstart = (e) => state.gameData.p = e.touches[0].clientX - container.offsetLeft - 10;
                cvsD.onclick = (e) => state.gameData.p = e.offsetX - 10;
                loopD();
                break;

            case 'neonJump':
                container.innerHTML = '<div style="position:absolute; bottom:0; width:100%; height:2px; background:#333"></div><div id="player" style="position:absolute; bottom:2px; left:140px; width:20px; height:20px; background:var(--accent-gold); border-radius:4px"></div>';
                const p = document.getElementById('player');
                let py = 0; let pj = false;
                container.onclick = () => {
                    if (!pj) {
                        pj = true; let jumpH = 0;
                        const jInt = setInterval(() => {
                            jumpH += 5; py = Math.sin(jumpH * Math.PI / 180) * 80;
                            p.style.bottom = (py + 2) + 'px';
                            if (jumpH >= 180) { clearInterval(jInt); pj = false; state.score++; updateScore(); }
                        }, 10);
                    }
                };
                break;

            case 'reflexTap':
                container.innerHTML = '<div id="target" style="width:60px; height:60px; border-radius:50%; background:red; position:absolute; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:800; color:#000">TAP!</div>';
                const t = document.getElementById('target');
                const mover = () => {
                    if (!state.gameActive) return;
                    t.style.left = Math.random() * 240 + 'px'; t.style.top = Math.random() * 260 + 'px';
                    const isGreen = Math.random() > 0.4;
                    t.style.background = isGreen ? 'var(--accent-green)' : '#ff4500';
                    t.dataset.valid = isGreen;
                };
                t.onclick = (e) => {
                    e.stopPropagation();
                    if (t.dataset.valid === 'true') { state.score++; updateScore(); mover(); }
                    else endGame(false);
                };
                mover();
                state.gameData.timer = setInterval(mover, 900);
                break;

            case 'fruitTap':
                state.gameData.timer = setInterval(() => {
                    if (!state.gameActive) return;
                    const f = document.createElement('div');
                    f.innerHTML = '🍎'; f.style.position = 'absolute'; f.style.fontSize = '2rem';
                    f.style.left = Math.random() * 260 + 'px'; f.style.top = Math.random() * 280 + 'px';
                    f.style.cursor = 'pointer';
                    f.onclick = () => { f.remove(); state.score++; updateScore(); };
                    container.appendChild(f);
                    setTimeout(() => f.remove(), 800);
                }, 700);
                break;

            case 'mathLink':
                const askM = () => {
                    const a = Math.floor(Math.random() * 15); const b = Math.floor(Math.random() * 15);
                    container.innerHTML = `<div style="text-align:center"><h2>${a} + ${b} = ?</h2><div id="opts" style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px; margin-top:20px"></div></div>`;
                    [a + b, a + b + 2, a + b - 1].sort(() => Math.random() - 0.5).forEach(o => {
                        const bO = document.createElement('button'); bO.innerText = o;
                        bO.style.padding = '12px 24px'; bO.style.borderRadius = '10px'; bO.style.border = 'none';
                        bO.style.background = 'var(--surface-dark)'; bO.style.color = '#fff';
                        bO.onclick = () => { if (o === a + b) { state.score++; updateScore(); askM(); } else endGame(false); };
                        document.getElementById('opts').appendChild(bO);
                    });
                };
                askM();
                break;

            case 'colorLogic':
            case 'colorMatch':
                const cols = ['RED', 'BLUE', 'GREEN', 'GOLD'];
                const hexs = { RED: '#ff4500', BLUE: '#00d2ff', GREEN: '#4ade80', GOLD: '#fbbf24' };
                const askC = () => {
                    const w = cols[Math.floor(Math.random() * 4)]; const t = cols[Math.floor(Math.random() * 4)];
                    container.innerHTML = `<div style="text-align:center"><h1 style="color:${hexs[t]}; font-size:3rem">${w}</h1><p style="margin-top:10px">Select the COLOR of the word</p><div id="copts" style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px; margin-top:20px"></div></div>`;
                    cols.forEach(c => {
                        const bC = document.createElement('button'); bC.innerText = c;
                        bC.style.padding = '10px 20px'; bC.style.borderRadius = '8px'; bC.style.border = 'none';
                        bC.onclick = () => { if (c === t) { state.score++; updateScore(); askC(); } else endGame(false); };
                        document.getElementById('copts').appendChild(bC);
                    });
                };
                askC();
                break;

            case 'flashRecall':
                let seq = []; let uSeq = [];
                const runS = () => {
                    if (!state.gameActive) return;
                    uSeq = []; seq.push(Math.floor(Math.random() * 4));
                    container.innerHTML = '<div id="pnl" style="display:grid; grid-template-columns:1fr 1fr; gap:15px"></div>';
                    for (let i = 0; i < 4; i++) {
                        const d = document.createElement('div'); d.style.width = '100px'; d.style.height = '100px';
                        d.style.background = '#1a1a1a'; d.style.borderRadius = '12px'; d.id = 'b' + i;
                        container.querySelector('#pnl').appendChild(d);
                    }
                    let sI = 0;
                    const vI = setInterval(() => {
                        if (!state.gameActive) { clearInterval(vI); return; }
                        const b = document.getElementById('b' + seq[sI]);
                        if (b) {
                            b.style.background = 'var(--accent-gold)';
                            setTimeout(() => { if (b) b.style.background = '#1a1a1a'; }, 400);
                        }
                        sI++; if (sI >= seq.length) { clearInterval(vI); setTimeout(enI, 200); }
                    }, 700);
                };
                const enI = () => {
                    if (!state.gameActive) return;
                    for (let i = 0; i < 4; i++) {
                        const b = document.getElementById('b' + i);
                        if (b) b.onclick = () => {
                            b.style.background = 'var(--accent-green)';
                            setTimeout(() => b.style.background = '#1a1a1a', 200);
                            uSeq.push(i);
                            if (uSeq[uSeq.length - 1] !== seq[uSeq.length - 1]) endGame(false);
                            else if (uSeq.length === seq.length) {
                                state.score++; updateScore();
                                setTimeout(runS, 600);
                            }
                        };
                    }
                };
                runS();
                break;

            case 'matchPair':
                const icons = ['💎', '🔥', '🌟', '💎', '🔥', '🌟'].sort(() => Math.random() - 0.5);
                container.innerHTML = '<div id="grd" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:15px"></div>';
                let fst = null; let lck = false;
                icons.forEach((ic, i) => {
                    const crd = document.createElement('div');
                    crd.style.width = '80px'; crd.style.height = '80px'; crd.style.background = '#1a1a1a';
                    crd.style.borderRadius = '10px'; crd.style.display = 'flex'; crd.style.alignItems = 'center';
                    crd.style.justifyContent = 'center'; crd.style.fontSize = '2rem'; crd.style.cursor = 'pointer';
                    crd.onclick = () => {
                        if (lck || crd.dataset.open === 'true') return;
                        crd.innerHTML = ic; crd.dataset.open = 'true';
                        if (!fst) fst = crd;
                        else {
                            if (fst.innerHTML === ic) { state.score++; updateScore(); fst = null; }
                            else {
                                lck = true;
                                setTimeout(() => { fst.innerHTML = ''; fst.dataset.open = 'false'; crd.innerHTML = ''; crd.dataset.open = 'false'; fst = null; lck = false; }, 500);
                            }
                        }
                    };
                    container.querySelector('#grd').appendChild(crd);
                });
                break;

            case 'quickQuiz':
                const qzs = [{ q: "Sun color?", a: "Yellow" }, { q: "10+5?", a: "15" }, { q: "Is Moon a planet?", a: "No" }];
                const startQ = () => {
                    const cur = qzs[Math.floor(Math.random() * qzs.length)];
                    container.innerHTML = `<div style="text-align:center"><h3>${cur.q}</h3><input id="ans" style="margin:20px; padding:12px; border-radius:10px; border:none; width:80%"><br><button id="sub" style="padding:10px 30px; background:var(--accent-green); border:none; border-radius:10px; font-weight:800">OK</button></div>`;
                    document.getElementById('sub').onclick = () => {
                        if (document.getElementById('ans').value.toLowerCase().trim() === cur.a.toLowerCase()) {
                            state.score++; updateScore(); startQ();
                        } else endGame(false);
                    };
                };
                startQ();
                break;

            case 'wordGuess':
                const words = ['WIN', 'CASH', 'FREE', 'SPIN'];
                const startW = () => {
                    const w = words[Math.floor(Math.random() * words.length)];
                    container.innerHTML = `<div style="text-align:center"><h3>Guess: ${w[0]}${'_'.repeat(w.length - 1)}</h3><p style="font-size:0.8rem; color:gray">Hint: It's a ${w.length} letter word</p><input id="wins" style="margin:20px; padding:12px; border-radius:10px; border:none; width:80%"><br><button id="wsub" style="padding:10px 30px; background:var(--accent-green); border:none; border-radius:10px; font-weight:800">DONE</button></div>`;
                    document.getElementById('wsub').onclick = () => {
                        if (document.getElementById('wins').value.toUpperCase().trim() === w) {
                            state.score++; updateScore(); startW();
                        } else endGame(false);
                    };
                };
                startW();
                break;

            case 'brickHit':
                container.innerHTML = '<div id="p" style="position:absolute; bottom:10px; left:120px; width:60px; height:8px; background:var(--accent-green); border-radius:4px"></div><div id="b" style="position:absolute; bottom:20px; left:145px; width:10px; height:10px; background:#fff; border-radius:50%"></div>';
                const pB = document.getElementById('p'); const bB = document.getElementById('b');
                let bx = 145, by = 270, dx = 3, dy = -3;
                const loopB = () => {
                    if (!state.gameActive) return;
                    bx += dx; by += dy;
                    if (bx < 0 || bx > 290) dx = -dx; if (by < 0) dy = -dy;
                    if (by > 282) {
                        const px = parseInt(pB.style.left);
                        if (bx > px && bx < px + 60) { dy = -dy; state.score++; updateScore(); }
                        else endGame(false);
                    }
                    bB.style.left = bx + 'px'; bB.style.top = by + 'px';
                    state.gameData.aniId = requestAnimationFrame(loopB);
                };
                container.ontouchmove = (e) => {
                    let x = e.touches[0].clientX - container.offsetLeft - 30;
                    pB.style.left = Math.max(0, Math.min(240, x)) + 'px';
                };
                container.onmousemove = (e) => {
                    let x = e.offsetX - 30;
                    pB.style.left = Math.max(0, Math.min(240, x)) + 'px';
                };
                loopB();
                break;

            case 'invader':
                container.innerHTML = '<div id="sh" style="position:absolute; bottom:10px; left:140px; font-size:2rem">🚀</div>';
                const sh = document.getElementById('sh');
                state.gameData.timer = setInterval(() => {
                    if (!state.gameActive) return;
                    const inv = document.createElement('div'); inv.innerHTML = '👾'; inv.style.position = 'absolute';
                    inv.style.left = Math.random() * 270 + 'px'; inv.style.top = '0px'; inv.style.fontSize = '1.5rem';
                    container.appendChild(inv);
                    let iy = 0;
                    const iF = setInterval(() => {
                        if (!state.gameActive) { clearInterval(iF); return; }
                        iy += 4; inv.style.top = iy + 'px';
                        if (iy > 270) {
                            const sx = parseInt(sh.style.left);
                            if (Math.abs(parseInt(inv.style.left) - sx) < 30) endGame(false);
                            else { inv.remove(); clearInterval(iF); state.score++; updateScore(); }
                        }
                    }, 30);
                }, 1000);
                container.ontouchmove = (e) => sh.style.left = (e.touches[0].clientX - container.offsetLeft - 15) + 'px';
                container.onmousemove = (e) => sh.style.left = (e.offsetX - 15) + 'px';
                break;
        }
    };

    function showToast(msg) {
        elements.toast.innerText = msg;
        elements.toast.style.display = "block";
        setTimeout(() => elements.toast.style.display = "none", 2500);
    }
});
