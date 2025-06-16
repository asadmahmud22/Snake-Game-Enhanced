const canvas = document.getElementById("gameCanvas");
        const ctx = canvas.getContext("2d");
        const scoreDisplay = document.getElementById("score");
        const highScoreDisplay = document.getElementById("highScore");
        const gameStatus = document.getElementById("gameStatus");
        const playBtn = document.getElementById("playBtn");
        const pauseBtn = document.getElementById("pauseBtn");
        const restartBtn = document.getElementById("restartBtn");
        const gameOverScreen = document.getElementById("gameOverScreen");

        const box = 20;
        const canvasSize = 400;
        const gridSize = canvasSize / box;

        let snake = [
            { x: 9, y: 10 },
            { x: 8, y: 10 },
            { x: 7, y: 10 }
        ];

        let direction = { x: 1, y: 0 };
        let nextDirection = { x: 1, y: 0 };
        let food = spawnFood();
        let score = 0;
        let highScore = localStorage.getItem('snakeHighScore') || 0;
        let gameState = 'stopped'; // 'stopped', 'playing', 'paused', 'gameOver'
        let gameLoop = null;
        let gameSpeed = 150;

        highScoreDisplay.textContent = highScore;

        function spawnFood() {
            let newFood;
            do {
                newFood = {
                    x: Math.floor(Math.random() * gridSize),
                    y: Math.floor(Math.random() * gridSize)
                };
            } while (snake.some(part => part.x === newFood.x && part.y === newFood.y));
            return newFood;
        }

        function drawRoundedRect(x, y, width, height, radius) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
        }

        function draw() {
            // Clear canvas with gradient
            const gradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
            gradient.addColorStop(0, '#0f0f23');
            gradient.addColorStop(1, '#1a1a2e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvasSize, canvasSize);

            // Draw grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= gridSize; i++) {
                ctx.beginPath();
                ctx.moveTo(i * box, 0);
                ctx.lineTo(i * box, canvasSize);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(0, i * box);
                ctx.lineTo(canvasSize, i * box);
                ctx.stroke();
            }

            // Draw snake with gradient and rounded corners
            snake.forEach((part, index) => {
                if (index === 0) {
                    // Head
                    const headGradient = ctx.createRadialGradient(
                        part.x * box + box/2, part.y * box + box/2, 0,
                        part.x * box + box/2, part.y * box + box/2, box/2
                    );
                    headGradient.addColorStop(0, '#4ecdc4');
                    headGradient.addColorStop(1, '#44a08d');
                    ctx.fillStyle = headGradient;
                } else {
                    // Body
                    const bodyGradient = ctx.createRadialGradient(
                        part.x * box + box/2, part.y * box + box/2, 0,
                        part.x * box + box/2, part.y * box + box/2, box/2
                    );
                    bodyGradient.addColorStop(0, '#7bed9f');
                    bodyGradient.addColorStop(1, '#70a1ff');
                    ctx.fillStyle = bodyGradient;
                }
                
                drawRoundedRect(part.x * box + 1, part.y * box + 1, box - 2, box - 2, 6);
                
                // Add shine effect
                if (index === 0) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    drawRoundedRect(part.x * box + 3, part.y * box + 3, box - 10, box - 10, 3);
                }
            });

            // Draw food with pulsing effect
            const time = Date.now() * 0.005;
            const pulseSize = Math.sin(time) * 2;
            const foodGradient = ctx.createRadialGradient(
                food.x * box + box/2, food.y * box + box/2, 0,
                food.x * box + box/2, food.y * box + box/2, box/2
            );
            foodGradient.addColorStop(0, '#FF6B6B');
            foodGradient.addColorStop(1, '#FF5252');
            ctx.fillStyle = foodGradient;
            
            drawRoundedRect(
                food.x * box - pulseSize, 
                food.y * box - pulseSize, 
                box + pulseSize * 2, 
                box + pulseSize * 2, 
                8
            );
            
            // Food shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            drawRoundedRect(food.x * box + 4, food.y * box + 4, box - 12, box - 12, 4);
        }

        function update() {
            if (gameState !== 'playing') return;

            direction = { ...nextDirection };
            const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

            // Check collision with walls or self
            if (
                head.x < 0 || head.y < 0 ||
                head.x >= gridSize || head.y >= gridSize ||
                snake.some(part => part.x === head.x && part.y === head.y)
            ) {
                endGame();
                return;
            }

            snake.unshift(head);

            // Check food collision
            if (head.x === food.x && head.y === food.y) {
                score++;
                scoreDisplay.textContent = score;
                food = spawnFood();
                
                // Increase speed slightly
                if (gameSpeed > 80) {
                    gameSpeed = Math.max(80, gameSpeed - 2);
                    clearInterval(gameLoop);
                    gameLoop = setInterval(update, gameSpeed);
                }
                
                // Update status
                gameStatus.textContent = `Bagus! Skor: ${score}`;
            } else {
                snake.pop();
            }

            draw();
        }

        function startGame() {
            if (gameState === 'stopped' || gameState === 'gameOver') {
                resetGame();
            }
            
            gameState = 'playing';
            playBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-block';
            gameStatus.textContent = 'Permainan dimulai! Semangat!';
            
            gameLoop = setInterval(update, gameSpeed);
        }

        function pauseGame() {
            if (gameState === 'playing') {
                gameState = 'paused';
                clearInterval(gameLoop);
                playBtn.style.display = 'inline-block';
                pauseBtn.style.display = 'none';
                gameStatus.textContent = 'Permainan dijeda. Tekan PLAY untuk melanjutkan.';
            }
        }

        function endGame() {
            gameState = 'gameOver';
            clearInterval(gameLoop);
            
            // Check high score
            if (score > highScore) {
                highScore = score;
                highScoreDisplay.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
                document.getElementById('newHighScore').style.display = 'block';
            } else {
                document.getElementById('newHighScore').style.display = 'none';
            }
            
            document.getElementById('finalScore').textContent = score;
            gameOverScreen.style.display = 'block';
            
            playBtn.style.display = 'inline-block';
            pauseBtn.style.display = 'none';
            gameStatus.textContent = 'Game Over! Coba lagi?';
        }

        function restartGame() {
            resetGame();
            gameOverScreen.style.display = 'none';
            gameStatus.textContent = 'Tekan PLAY untuk memulai!';
        }

        function resetGame() {
            snake = [
                { x: 9, y: 10 },
                { x: 8, y: 10 },
                { x: 7, y: 10 }
            ];
            direction = { x: 1, y: 0 };
            nextDirection = { x: 1, y: 0 };
            food = spawnFood();
            score = 0;
            gameSpeed = 150;
            scoreDisplay.textContent = score;
            
            clearInterval(gameLoop);
            gameState = 'stopped';
            playBtn.style.display = 'inline-block';
            pauseBtn.style.display = 'none';
            
            draw();
        }

        function changeDirection(newDirection) {
            if (gameState !== 'playing') return;
            
            // Prevent reverse direction
            if (newDirection.x !== 0 && direction.x === 0) {
                nextDirection = newDirection;
            } else if (newDirection.y !== 0 && direction.y === 0) {
                nextDirection = newDirection;
            }
        }

        // Event listeners
        playBtn.addEventListener('click', startGame);
        pauseBtn.addEventListener('click', pauseGame);
        restartBtn.addEventListener('click', restartGame);

        // Keyboard controls
        document.addEventListener('keydown', e => {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    changeDirection({ x: 0, y: -1 });
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    changeDirection({ x: 0, y: 1 });
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    changeDirection({ x: -1, y: 0 });
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    changeDirection({ x: 1, y: 0 });
                    break;
                case ' ':
                    e.preventDefault();
                    if (gameState === 'playing') {
                        pauseGame();
                    } else if (gameState === 'paused') {
                        startGame();
                    }
                    break;
            }
        });

        // Mobile controls
        document.getElementById('upBtn').addEventListener('click', () => changeDirection({ x: 0, y: -1 }));
        document.getElementById('downBtn').addEventListener('click', () => changeDirection({ x: 0, y: 1 }));
        document.getElementById('leftBtn').addEventListener('click', () => changeDirection({ x: -1, y: 0 }));
        document.getElementById('rightBtn').addEventListener('click', () => changeDirection({ x: 1, y: 0 }));

        // Initialize game
        draw();
