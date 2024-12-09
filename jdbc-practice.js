let currentScore = 0;
const questionScores = {
    1: 4,  // 加载数据库驱动
    2: 5,  // 连接数据库
    3: 6,  // SQL插入语句
    4: 5,  // 执行插入操作
    5: 5,  // 执行查询操作
    6: 4,  // 遍历结果集
    7: 3,  // 存储数据到request
    8: 3   // 转发请求
};

// 获取题目分值
function getQuestionScore(questionNum) {
    return questionScores[questionNum] || 0;
}

// 更新总分
function updateScore(questionNum, score) {
    const previousScore = sessionStorage.getItem(`q${questionNum}_score`) || 0;
    sessionStorage.setItem(`q${questionNum}_score`, score);
    
    // 更新总分
    currentScore = Object.keys(questionScores).reduce((total, qNum) => {
        return total + Number(sessionStorage.getItem(`q${qNum}_score`) || 0);
    }, 0);
    
    // 更新显示
    const scoreElement = document.getElementById('totalScore');
    scoreElement.textContent = currentScore;
    
    // 添加分数变化动画
    scoreElement.classList.remove('score-change');
    void scoreElement.offsetWidth; // 触发重排
    scoreElement.classList.add('score-change');
    
    // 更新进度条
    const totalPossibleScore = Object.values(questionScores).reduce((a, b) => a + b, 0);
    const percentage = (currentScore / totalPossibleScore) * 100;
    
    // 更新主进度条
    document.getElementById('progressBar').style.width = `${percentage}%`;
    // 更新得分区域的进度条
    document.getElementById('scoreProgressBar').style.width = `${percentage}%`;
    
    // 根据得分更新颜色
    const scoreNumber = document.querySelector('.score-number');
    if (currentScore === totalPossibleScore) {
        scoreNumber.style.color = '#4CAF50'; // 满分显示绿色
    } else if (currentScore >= totalPossibleScore * 0.6) {
        scoreNumber.style.color = '#1a73e8'; // 及格显示蓝色
    } else {
        scoreNumber.style.color = '#f44336'; // 不及格显示红色
    }
}

// 添加一个新的函数来比较字符串差异
function compareAnswers(userAnswer, correctAnswer) {
    let diffHtml = '';
    let i = 0, j = 0;
    
    // 去除首尾空格后比较
    userAnswer = userAnswer.trim();
    correctAnswer = correctAnswer.trim();
    
    while (i < userAnswer.length || j < correctAnswer.length) {
        if (i >= userAnswer.length) {
            // 用户答案较短，将剩余的正确答案标记为缺失
            diffHtml += `<span style="background-color: #fef9c3; color: #92400e">${correctAnswer.slice(j)}</span>`;
            break;
        } else if (j >= correctAnswer.length) {
            // 用户答案较长，将多余部分标记为错误
            diffHtml += `<span style="background-color: #fee2e2; color: #dc2626">${userAnswer.slice(i)}</span>`;
            break;
        } else if (userAnswer[i] === correctAnswer[j]) {
            // 相同的字符
            diffHtml += `<span style="color: #1e293b">${userAnswer[i]}</span>`;
            i++;
            j++;
        } else {
            // 找到下一个匹配点
            let nextMatch = -1;
            for (let k = 1; k < 3; k++) { // 向前看最多3个字符
                if (userAnswer[i + k] === correctAnswer[j]) {
                    nextMatch = k;
                    break;
                }
                if (userAnswer[i] === correctAnswer[j + k]) {
                    // 用户漏掉了字符
                    diffHtml += `<span style="background-color: #fef9c3; color: #92400e">${correctAnswer.slice(j, j + k)}</span>`;
                    j += k;
                    nextMatch = 0;
                    break;
                }
            }
            
            if (nextMatch >= 0) {
                if (nextMatch > 0) {
                    // 用户输入了错误的字符
                    diffHtml += `<span style="background-color: #fee2e2; color: #dc2626">${userAnswer.slice(i, i + nextMatch)}</span>`;
                    i += nextMatch;
                }
            } else {
                // 单个字符不匹配
                diffHtml += `<span style="background-color: #fee2e2; color: #dc2626">${userAnswer[i]}</span>`;
                i++;
                j++;
            }
        }
    }
    
    return diffHtml;
}

// 检查答案
function checkAnswer(questionNum) {
    const input = document.getElementById(`answer${questionNum}`);
    const result = input.closest('.inline-answer').querySelector('.result');
    const expectedAnswer = input.dataset.answer;
    const scoreValue = getQuestionScore(questionNum);
    
    if (input.value.trim() === expectedAnswer) {
        result.innerHTML = `
            <div style="display: flex; align-items: center; gap: 6px;">
                <span style="color: #38a169; font-size: 16px;">✓</span>
                <span>答案正确！获得 ${scoreValue} 分</span>
            </div>
        `;
        result.className = "result correct";
        updateScore(questionNum, scoreValue);
        
        // 添加成功动画
        input.style.animation = "correct 0.5s ease";
        setTimeout(() => input.style.animation = "", 500);
    } else {
        const diffHtml = compareAnswers(input.value, expectedAnswer);
        result.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%; gap: 8px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="color: #e53e3e; font-size: 16px;">✗</span>
                        <span>答案不正确，差异对比：</span>
                    </div>
                    <button class="show-answer-btn" onclick="event.stopPropagation(); showAnswer(${questionNum})">
                        查看完整答案
                        <span style="margin-left: 4px;">→</span>
                    </button>
                </div>
                <div style="font-family: monospace; background: #f8fafc; padding: 8px; border-radius: 4px; line-height: 1.5;">
                    ${diffHtml}
                </div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                    <span style="color: #dc2626;">红色</span>: 错误输入
                    <span style="margin-left: 8px; color: #92400e;">黄色</span>: 缺失内容
                </div>
            </div>
        `;
        result.className = "result incorrect";
        updateScore(questionNum, 0);
    }
    
    result.style.display = "flex";
    result.style.animation = "slideIn 0.3s ease";
}

// 显示提示
function showHint(questionNum) {
    const hint = document.getElementById(`answer${questionNum}`).closest('.inline-answer').querySelector('.hint');
    hint.style.display = hint.style.display === 'none' ? 'block' : 'none';
}

// 显示答案
function showAnswer(questionNum) {
    const input = document.getElementById(`answer${questionNum}`);
    const answerDisplay = input.closest('.inline-answer').querySelector('.answer-display');
    
    // 如果答案已经显示，则隐藏
    if (answerDisplay.classList.contains('visible')) {
        answerDisplay.classList.remove('visible');
        return;
    }

    // 设置答案内容
    answerDisplay.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
            <span style="color: #4299e1;">✨</span>
            <span style="color: #4a5568;">参考答案：</span>
        </div>
        <code style="display: block; padding: 8px; background: rgba(66,153,225,0.05); 
                     border-radius: 4px; color: #3182ce;">${input.dataset.answer}</code>
    `;
    
    answerDisplay.classList.add('visible');
    
    // 平滑滚动到答案位置
    setTimeout(() => {
        answerDisplay.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest',
            inline: 'nearest' 
        });
    }, 100);
}

// 显示所有答案
function showAllAnswers() {
    for(let i = 1; i <= 8; i++) {
        const input = document.getElementById(`answer${i}`);
        input.value = input.dataset.answer;
        input.style.color = '#3182ce';
        const result = input.parentElement.querySelector('.result');
        result.style.display = 'none';
    }
}

// 隐藏所有答案
function hideAllAnswers() {
    for(let i = 1; i <= 8; i++) {
        const input = document.getElementById(`answer${i}`);
        const answerDisplay = document.getElementById(`answerDisplay${i}`);
        input.value = '';
        input.style.color = '#2d3748';
        const result = input.parentElement.querySelector('.result');
        result.style.display = 'none';
        answerDisplay.classList.remove('visible');
    }
    resetScore();
}

// 重置答案
function resetAnswers() {
    hideAllAnswers();
    const hints = document.querySelectorAll('.hint');
    hints.forEach(hint => hint.style.display = 'none');
}

// 重置分数
function resetScore() {
    currentScore = 0;
    document.getElementById('totalScore').textContent = currentScore;
    Object.keys(questionScores).forEach(qNum => {
        sessionStorage.removeItem(`q${qNum}_score`);
    });
    updateProgress();
}

// 更新进度条
function updateProgress() {
    const totalPossibleScore = Object.values(questionScores).reduce((a, b) => a + b, 0);
    const percentage = (currentScore / totalPossibleScore) * 100;
    document.getElementById('progressBar').style.width = `${percentage}%`;
}

// 添加键盘快捷键
document.addEventListener('keydown', function(e) {
    if (e.altKey) {
        switch(e.key.toLowerCase()) {
            case 'a': showAllAnswers(); break;
            case 'h': hideAllAnswers(); break;
            case 'r': resetAnswers(); break;
        }
    }
});

// 页面加载时初始化
window.onload = function() {
    resetScore();
    // 添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes correct {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }

        .show-answer-btn {
            background: none;
            border: 1px solid #e53e3e;
            color: #e53e3e;
            padding: 2px 8px;
            border-radius: 3px;
            margin-left: 10px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }

        .show-answer-btn:hover {
            background: #e53e3e;
            color: white;
        }
    `;
    document.head.appendChild(style);
};

// 添加输入验证
document.querySelectorAll('.answer-input').forEach(input => {
    input.addEventListener('input', function() {
        const submitButton = this.nextElementSibling;
        submitButton.disabled = !this.value.trim();
        submitButton.style.opacity = this.value.trim() ? '1' : '0.6';
    });
});

// 添加键盘提交支持
document.querySelectorAll('.answer-input').forEach(input => {
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const questionNum = this.id.replace('answer', '');
            checkAnswer(questionNum);
        }
    });
});

// 添加提示显示切换功能
function toggleHint(questionNum) {
    const hint = document.getElementById(`hint${questionNum}`);
    if (hint.classList.contains('visible')) {
        hint.classList.remove('visible');
    } else {
        hint.classList.add('visible');
    }
} 