async function loadQuestionsFromFile() {
    try {
        const response = await fetch('./选择题.txt');
        const text = await response.text();
        
        // 解析文本内容
        const chapters = {};
        let currentChapter = null;
        let currentQuestion = null;
        let isCollectingCodeBlock = false;
        let codeBlock = [];
        
        // 按行分割文本
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            
            // 跳过空行，但保留题目之间的分隔符"---"
            if (line === '' && !line.includes('---')) continue;
            
            // 检测章节
            if (line.includes('第') && line.includes('章')) {
                const chapterNum = line.match(/第(.+?)章/)[1];
                currentChapter = `chapter${chapterNum}`;
                if (!chapters[currentChapter]) {
                    chapters[currentChapter] = [];
                }
                continue;
            }
            
            // 检测新题目
            const questionMatch = line.match(/^\d+\./);
            if (questionMatch) {
                // 保存前一个题目（如果存在）
                if (currentQuestion && currentChapter) {
                    chapters[currentChapter].push(currentQuestion);
                }
                
                // 创建新题目对象
                currentQuestion = {
                    question: line,
                    options: [],
                    answer: ''
                };
                continue;
            }
            
            // 检测代码块开始
            if (line.match(/^(html|java|jsp)$/) || line.includes('代码片段：')) {
                isCollectingCodeBlock = true;
                continue;
            }
            
            // 检测代码块结束
            if (isCollectingCodeBlock && (line.match(/^[A-D]\./) || line === '---')) {
                if (currentQuestion && codeBlock.length > 0) {
                    currentQuestion.question += '\n' + codeBlock.join('\n');
                    codeBlock = [];
                }
                isCollectingCodeBlock = false;
            }
            
            // 收集代码块内容
            if (isCollectingCodeBlock) {
                codeBlock.push(line);
                continue;
            }
            
            // 检测选项
            const optionMatch = line.match(/^[A-D]\./);
            if (optionMatch) {
                if (currentQuestion) {
                    currentQuestion.options.push(line);
                }
                continue;
            }
            
            // 检测答案
            if (line.startsWith('答案：')) {
                if (currentQuestion) {
                    currentQuestion.answer = line.substring(3).trim();
                    // 如果下一行是分隔符或空行，立即保存当前题目
                    if (i === lines.length - 1 || lines[i + 1].trim() === '---' || lines[i + 1].trim() === '') {
                        if (currentChapter) {
                            chapters[currentChapter].push(currentQuestion);
                            currentQuestion = null;
                        }
                    }
                }
                continue;
            }
            
            // 处理题目的附加内容
            if (currentQuestion && !line.match(/^[A-D]\./) && !line.startsWith('答案：')) {
                currentQuestion.question += '\n' + line;
            }
        }
        
        // 确保最后一个题目也被添加
        if (currentQuestion && currentChapter) {
            chapters[currentChapter].push(currentQuestion);
        }

        // 添加调试日志
        console.log('Parsed chapters:', chapters);
        
        return chapters;
    } catch (error) {
        console.error('加载题目失败:', error);
        throw error;
    }
}
