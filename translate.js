const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const map = {
  // Common UI words
  '保存': 'Save',
  '戻る': 'Back',
  'キャンセル': 'Cancel',
  '削除': 'Delete',
  '編集': 'Edit',
  '追加': 'Add',
  '完了': 'Done',
  '閉じる': 'Close',
  '設定': 'Settings',
  '更新': 'Update',
  '入力': 'Input',
  '確認': 'Confirm',
  '選択': 'Select',
  '必須': 'Required',
  
  // Specific words from context
  '買い': 'BUY',
  '売り': 'SELL',
  '上昇': 'Uptrend',
  '下降': 'Downtrend',
  '評価不能': 'Cannot Evaluate',
  '判断不能': 'Unclear',
  '評価できない': 'Cannot Evaluate',
  '判断できない': 'Unclear',
  '下書き': 'Draft',
  '計画確定': 'Plan Confirmed',
  '計画中': 'Plan Confirmed', // In old data, just map to confirm
  'エントリー済み': 'Entered',
  '決済済み': 'Closed',
  'レビュー済み': 'Reviewed',
  '見送り': 'Skipped',
  '問題なし': 'Pass',
  '問題あり': 'Fail',
  '未回答': 'Unanswered',
  
  // Labels
  '通貨ペア / 銘柄': 'Symbol',
  '売買方向': 'Direction',
  '取引セッション': 'Session',
  '日付': 'Date',
  'ステータス': 'Status',
  '基本情報': 'Basic Info',
  '相場環境': 'Market Context',
  'セットアップ': 'Setup',
  '価格・リスク': 'Price & Risk',
  'シナリオとメモ': 'Scenario & Notes',
  '計画': 'Plan',
  'エントリー・決済結果': 'Entry & Exit Result',
  '振り返り・評価': 'Review & Evaluation',
  
  // Enums for TS types mapping in validations
  '売り注文ですが、損切り価格がエントリー価格以下になっています。': 'For a SELL order, stop loss must be above entry price.',
  '売り注文ですが、利確目標価格がエントリー価格以上になっています。': 'For a SELL order, take profit must be below entry price.',
  '買い注文ですが、損切り価格がエントリー価格以上になっています。': 'For a BUY order, stop loss must be below entry price.',
  '買い注文ですが、利確目標価格がエントリー価格以下になっています。': 'For a BUY order, take profit must be above entry price.',

  // Form strings
  '未入力': 'Unset',
  '「問題あり」または「判断できない」と回答した項目があります。\\nこれは不確実性の高いトレードを示唆しています。\\n本当にこの計画を確定してエントリーに進みますか？': 'There are questions answered with "Fail" or "Unclear".\nThis suggests high uncertainty.\nAre you sure you want to confirm this plan?',
  '未回答のチェック項目があります。すべて回答してください。': 'Please answer all checklist items.',
  'その他': 'Other',
  '東京': 'Tokyo',
  
  // Rules
  'エントリー': 'Entry',
  '相場環境': 'Market Bias',
  'リスク管理': 'Risk Management',

  // Misc
  'bg-zinc-900': 'bg-violet-600',
  'text-zinc-900': 'text-zinc-900',
};

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if((dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) && !dirFile.includes('AppInit.ts') && !dirFile.includes('types/index.ts')) {
         filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync(directoryPath);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  Object.keys(map).forEach(key => {
    content = content.split(key).join(map[key]);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
