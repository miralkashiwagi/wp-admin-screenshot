const fs = require('fs');
const path = require('path');
const { exec } = require('child_process'); // 子プロセスを起動するためのモジュール

async function generateSimpleReportPage(screenshotsDir) {
    const reportPath = path.join(__dirname, 'report.html');
    const files = await fs.promises.readdir(screenshotsDir);
    const imageFiles = files.filter(file => file.endsWith('.png'));

    let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Screenshot Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
        }
        .screenshot {
            margin-bottom: 20px;
        }
        img {
            max-width: 600px;
            height: auto;
        }
        h2 {
            font-size: 24px;
        }
    </style>
</head>
<body>
    <h1>Screenshot Report</h1>
`;

    imageFiles.forEach(file => {
        const filePath = path.join('screenshots', file);
        htmlContent += `
    <div class="screenshot">
        <h2>${file}</h2>
        <img src="${filePath}" alt="${file}">
    </div>
`;
    });

    htmlContent += `
</body>
</html>
`;

    await fs.promises.writeFile(reportPath, htmlContent);
    console.log(`Report generated: ${reportPath}`);

    // レポートを自動的にブラウザで開く
    openReportInBrowser(reportPath);
}

function openReportInBrowser(reportPath) {
    const normalizedPath = path.normalize(reportPath);
    // OSによって異なるコマンドを使用
    const platform = process.platform;
    let command;

    if (platform === 'win32') {
        // Windowsの場合
        command = `start ${normalizedPath}`;
    } else if (platform === 'darwin') {
        // macOSの場合
        command = `open ${normalizedPath}`;
    } else if (platform === 'linux') {
        // Linuxの場合
        command = `xdg-open ${normalizedPath}`;
    }

    if (command) {
        exec(command, (err) => {
            if (err) {
                console.error('Failed to open the report in the browser:', err);
            } else {
                console.log('Report opened in the browser successfully.');
            }
        });
    } else {
        console.error('Unsupported platform. Please open the report manually:', normalizedPath);
    }
}

// スクリーンショットを保存するディレクトリのパスを指定
const screenshotsDir = path.join(__dirname, 'screenshots');
generateSimpleReportPage(screenshotsDir).catch(console.error);
