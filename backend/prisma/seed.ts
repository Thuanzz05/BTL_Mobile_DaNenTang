import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed database...');

  // Xóa dữ liệu cũ (nếu có)
  console.log('🗑️  Xóa dữ liệu cũ...');
  await prisma.learningResult.deleteMany();
  await prisma.learningProgress.deleteMany();
  await prisma.learningSession.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.example.deleteMany();
  await prisma.word.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.user.deleteMany();

  // Hash password
  const hashedPassword = await bcrypt.hash('123456', 10);

  // 1. Tạo Users
  console.log('👤 Tạo users...');
  
  const admin = await prisma.user.create({
    data: {
      fullName: 'Admin',
      email: 'admin@flashcard.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
    },
  });

  const user1 = await prisma.user.create({
    data: {
      fullName: 'Nguyễn Văn Thuấn',
      email: 'thuan@example.com',
      password: hashedPassword,
      role: 'user',
      status: 'active',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      fullName: 'Trần Thị Mai',
      email: 'mai@example.com',
      password: hashedPassword,
      role: 'user',
      status: 'active',
    },
  });

  console.log(`✅ Đã tạo ${3} users`);

  // 2. Tạo Topics
  console.log('📚 Tạo topics...');

  const topicDaily = await prisma.topic.create({
    data: {
      name: 'Giao tiếp hàng ngày',
      description: 'Các từ vựng thường dùng trong giao tiếp hàng ngày',
      image: '/images/topics/daily.jpg',
      status: 'active',
      displayOrder: 1,
    },
  });

  const topicFamily = await prisma.topic.create({
    data: {
      name: 'Gia đình',
      description: 'Từ vựng về các thành viên trong gia đình',
      image: '/images/topics/family.jpg',
      status: 'active',
      displayOrder: 2,
    },
  });

  const topicFood = await prisma.topic.create({
    data: {
      name: 'Đồ ăn',
      description: 'Tên các loại thức ăn, đồ uống phổ biến',
      image: '/images/topics/food.jpg',
      status: 'active',
      displayOrder: 3,
    },
  });

  const topicAnimals = await prisma.topic.create({
    data: {
      name: 'Động vật',
      description: 'Tên các loài động vật thường gặp',
      image: '/images/topics/animals.jpg',
      status: 'active',
      displayOrder: 4,
    },
  });

  const topicSchool = await prisma.topic.create({
    data: {
      name: 'Trường học',
      description: 'Từ vựng liên quan đến trường học và học tập',
      image: '/images/topics/school.jpg',
      status: 'active',
      displayOrder: 5,
    },
  });

  console.log(`✅ Đã tạo ${5} topics`);

  // 3. Tạo Words và Examples
  console.log('📝 Tạo words và examples...');

  // Chủ đề: Giao tiếp hàng ngày
  const wordHello = await prisma.word.create({
    data: {
      topicId: topicDaily.id,
      word: 'Hello',
      pronunciation: '/həˈloʊ/',
      vietnameseMeaning: 'Xin chào',
      partOfSpeech: 'interjection',
      audioUrl: '/audio/hello.mp3',
      imageUrl: '/images/words/hello.jpg',
      level: 'beginner',
      displayOrder: 1,
      examples: {
        create: [
          {
            englishSentence: 'Hello! How are you?',
            vietnameseSentence: 'Xin chào! Bạn khỏe không?',
            displayOrder: 1,
          },
          {
            englishSentence: 'Hello, my name is John.',
            vietnameseSentence: 'Xin chào, tôi tên là John.',
            displayOrder: 2,
          },
        ],
      },
    },
  });

  const wordThankYou = await prisma.word.create({
    data: {
      topicId: topicDaily.id,
      word: 'Thank you',
      pronunciation: '/θæŋk juː/',
      vietnameseMeaning: 'Cảm ơn',
      partOfSpeech: 'interjection',
      audioUrl: '/audio/thank-you.mp3',
      imageUrl: '/images/words/thank-you.jpg',
      level: 'beginner',
      displayOrder: 2,
      examples: {
        create: [
          {
            englishSentence: 'Thank you very much!',
            vietnameseSentence: 'Cảm ơn bạn rất nhiều!',
            displayOrder: 1,
          },
        ],
      },
    },
  });

  const wordGoodbye = await prisma.word.create({
    data: {
      topicId: topicDaily.id,
      word: 'Goodbye',
      pronunciation: '/ɡʊdˈbaɪ/',
      vietnameseMeaning: 'Tạm biệt',
      partOfSpeech: 'interjection',
      audioUrl: '/audio/goodbye.mp3',
      imageUrl: '/images/words/goodbye.jpg',
      level: 'beginner',
      displayOrder: 3,
      examples: {
        create: [
          {
            englishSentence: 'Goodbye! See you tomorrow.',
            vietnameseSentence: 'Tạm biệt! Hẹn gặp lại ngày mai.',
            displayOrder: 1,
          },
        ],
      },
    },
  });

  // Chủ đề: Gia đình
  const wordFather = await prisma.word.create({
    data: {
      topicId: topicFamily.id,
      word: 'Father',
      pronunciation: '/ˈfɑːðər/',
      vietnameseMeaning: 'Bố, cha',
      partOfSpeech: 'noun',
      audioUrl: '/audio/father.mp3',
      imageUrl: '/images/words/father.jpg',
      level: 'beginner',
      displayOrder: 1,
      examples: {
        create: [
          {
            englishSentence: 'My father is a teacher.',
            vietnameseSentence: 'Bố tôi là một giáo viên.',
            displayOrder: 1,
          },
        ],
      },
    },
  });

  const wordMother = await prisma.word.create({
    data: {
      topicId: topicFamily.id,
      word: 'Mother',
      pronunciation: '/ˈmʌðər/',
      vietnameseMeaning: 'Mẹ',
      partOfSpeech: 'noun',
      audioUrl: '/audio/mother.mp3',
      imageUrl: '/images/words/mother.jpg',
      level: 'beginner',
      displayOrder: 2,
      examples: {
        create: [
          {
            englishSentence: 'My mother loves cooking.',
            vietnameseSentence: 'Mẹ tôi thích nấu ăn.',
            displayOrder: 1,
          },
        ],
      },
    },
  });

  const wordBrother = await prisma.word.create({
    data: {
      topicId: topicFamily.id,
      word: 'Brother',
      pronunciation: '/ˈbrʌðər/',
      vietnameseMeaning: 'Anh trai, em trai',
      partOfSpeech: 'noun',
      audioUrl: '/audio/brother.mp3',
      imageUrl: '/images/words/brother.jpg',
      level: 'beginner',
      displayOrder: 3,
      examples: {
        create: [
          {
            englishSentence: 'I have one brother.',
            vietnameseSentence: 'Tôi có một người anh trai.',
            displayOrder: 1,
          },
        ],
      },
    },
  });

  const wordSister = await prisma.word.create({
    data: {
      topicId: topicFamily.id,
      word: 'Sister',
      pronunciation: '/ˈsɪstər/',
      vietnameseMeaning: 'Chị gái, em gái',
      partOfSpeech: 'noun',
      audioUrl: '/audio/sister.mp3',
      imageUrl: '/images/words/sister.jpg',
      level: 'beginner',
      displayOrder: 4,
      examples: {
        create: [
          {
            englishSentence: 'My sister is 10 years old.',
            vietnameseSentence: 'Em gái tôi 10 tuổi.',
            displayOrder: 1,
          },
        ],
      },
    },
  });

  // Chủ đề: Đồ ăn
  const wordApple = await prisma.word.create({
    data: {
      topicId: topicFood.id,
      word: 'Apple',
      pronunciation: '/ˈæpəl/',
      vietnameseMeaning: 'Quả táo',
      partOfSpeech: 'noun',
      audioUrl: '/audio/apple.mp3',
      imageUrl: '/images/words/apple.jpg',
      level: 'beginner',
      displayOrder: 1,
      examples: {
        create: [
          {
            englishSentence: 'I eat an apple every day.',
            vietnameseSentence: 'Tôi ăn một quả táo mỗi ngày.',
            displayOrder: 1,
          },
          {
            englishSentence: 'This apple is very sweet.',
            vietnameseSentence: 'Quả táo này rất ngọt.',
            displayOrder: 2,
          },
        ],
      },
    },
  });

  const wordBanana = await prisma.word.create({
    data: {
      topicId: topicFood.id,
      word: 'Banana',
      pronunciation: '/bəˈnænə/',
      vietnameseMeaning: 'Quả chuối',
      partOfSpeech: 'noun',
      audioUrl: '/audio/banana.mp3',
      imageUrl: '/images/words/banana.jpg',
      level: 'beginner',
      displayOrder: 2,
      examples: {
        create: [
          {
            englishSentence: 'She likes bananas.',
            vietnameseSentence: 'Cô ấy thích chuối.',
            displayOrder: 1,
          },
        ],
      },
    },
  });

  const wordBread = await prisma.word.create({
    data: {
      topicId: topicFood.id,
      word: 'Bread',
      pronunciation: '/bred/',
      vietnameseMeaning: 'Bánh mì',
      partOfSpeech: 'noun',
      audioUrl: '/audio/bread.mp3',
      imageUrl: '/images/words/bread.jpg',
      level: 'beginner',
      displayOrder: 3,
      examples: {
        create: [
          {
            englishSentence: 'I want some bread.',
            vietnameseSentence: 'Tôi muốn ít bánh mì.',
            displayOrder: 1,
          },
        ],
      },
    },
  });

  const wordMilk = await prisma.word.create({
    data: {
      topicId: topicFood.id,
      word: 'Milk',
      pronunciation: '/mɪlk/',
      vietnameseMeaning: 'Sữa',
      partOfSpeech: 'noun',
      audioUrl: '/audio/milk.mp3',
      imageUrl: '/images/words/milk.jpg',
      level: 'beginner',
      displayOrder: 4,
      examples: {
        create: [
          {
            englishSentence: 'He drinks milk every morning.',
            vietnameseSentence: 'Anh ấy uống sữa mỗi sáng.',
            displayOrder: 1,
          },
        ],
      },
    },
  });

  const wordWater = await prisma.word.create({
    data: {
      topicId: topicFood.id,
      word: 'Water',
      pronunciation: '/ˈwɔːtər/',
      vietnameseMeaning: 'Nước',
      partOfSpeech: 'noun',
      audioUrl: '/audio/water.mp3',
      imageUrl: '/images/words/water.jpg',
      level: 'beginner',
      displayOrder: 5,
      examples: {
        create: [
          {
            englishSentence: 'I need a glass of water.',
            vietnameseSentence: 'Tôi cần một cốc nước.',
            displayOrder: 1,
          },
        ],
      },
    },
  });

  // Chủ đề: Động vật
  const wordDog = await prisma.word.create({
    data: {
      topicId: topicAnimals.id,
      word: 'Dog',
      pronunciation: '/dɔːɡ/',
      vietnameseMeaning: 'Chó',
      partOfSpeech: 'noun',
      audioUrl: '/audio/dog.mp3',
      imageUrl: '/images/words/dog.jpg',
      level: 'beginner',
      displayOrder: 1,
      examples: {
        create: [
          {
            englishSentence: 'I have a dog.',
            vietnameseSentence: 'Tôi có một con chó.',
            displayOrder: 1,
          },
        ],
      },
    },
  });

  const wordCat = await prisma.word.create({
    data: {
      topicId: topicAnimals.id,
      word: 'Cat',
      pronunciation: '/kæt/',
      vietnameseMeaning: 'Mèo',
      partOfSpeech: 'noun',
      audioUrl: '/audio/cat.mp3',
      imageUrl: '/images/words/cat.jpg',
      level: 'beginner',
      displayOrder: 2,
      examples: {
        create: [
          {
            englishSentence: 'The cat is sleeping.',
            vietnameseSentence: 'Con mèo đang ngủ.',
            displayOrder: 1,
          },
        ],
      },
    },
  });

  const wordBird = await prisma.word.create({
    data: {
      topicId: topicAnimals.id,
      word: 'Bird',
      pronunciation: '/bɜːrd/',
      vietnameseMeaning: 'Chim',
      partOfSpeech: 'noun',
      audioUrl: '/audio/bird.mp3',
      imageUrl: '/images/words/bird.jpg',
      level: 'beginner',
      displayOrder: 3,
      examples: {
        create: [
          {
            englishSentence: 'Birds can fly.',
            vietnameseSentence: 'Chim có thể bay.',
            displayOrder: 1,
          },
        ],
      },
    },
  });

  // Chủ đề: Trường học
  const wordBook = await prisma.word.create({
    data: {
      topicId: topicSchool.id,
      word: 'Book',
      pronunciation: '/bʊk/',
      vietnameseMeaning: 'Quyển sách',
      partOfSpeech: 'noun',
      audioUrl: '/audio/book.mp3',
      imageUrl: '/images/words/book.jpg',
      level: 'beginner',
      displayOrder: 1,
      examples: {
        create: [
          {
            englishSentence: 'I am reading a book.',
            vietnameseSentence: 'Tôi đang đọc sách.',
            displayOrder: 1,
          },
        ],
      },
    },
  });

  const wordPen = await prisma.word.create({
    data: {
      topicId: topicSchool.id,
      word: 'Pen',
      pronunciation: '/pen/',
      vietnameseMeaning: 'Bút mực',
      partOfSpeech: 'noun',
      audioUrl: '/audio/pen.mp3',
      imageUrl: '/images/words/pen.jpg',
      level: 'beginner',
      displayOrder: 2,
      examples: {
        create: [
          {
            englishSentence: 'Can I borrow your pen?',
            vietnameseSentence: 'Tôi có thể mượn bút của bạn không?',
            displayOrder: 1,
          },
        ],
      },
    },
  });

  const wordTeacher = await prisma.word.create({
    data: {
      topicId: topicSchool.id,
      word: 'Teacher',
      pronunciation: '/ˈtiːtʃər/',
      vietnameseMeaning: 'Giáo viên',
      partOfSpeech: 'noun',
      audioUrl: '/audio/teacher.mp3',
      imageUrl: '/images/words/teacher.jpg',
      level: 'beginner',
      displayOrder: 3,
      examples: {
        create: [
          {
            englishSentence: 'My teacher is very kind.',
            vietnameseSentence: 'Giáo viên của tôi rất tốt bụng.',
            displayOrder: 1,
          },
        ],
      },
    },
  });

  const wordStudent = await prisma.word.create({
    data: {
      topicId: topicSchool.id,
      word: 'Student',
      pronunciation: '/ˈstuːdənt/',
      vietnameseMeaning: 'Học sinh',
      partOfSpeech: 'noun',
      audioUrl: '/audio/student.mp3',
      imageUrl: '/images/words/student.jpg',
      level: 'beginner',
      displayOrder: 4,
      examples: {
        create: [
          {
            englishSentence: 'She is a good student.',
            vietnameseSentence: 'Cô ấy là một học sinh giỏi.',
            displayOrder: 1,
          },
        ],
      },
    },
  });

  console.log(`✅ Đã tạo ${20} words với examples`);

  // 4. Tạo Favorites cho user1
  console.log('❤️  Tạo favorites...');

  await prisma.favorite.createMany({
    data: [
      { userId: user1.id, wordId: wordApple.id },
      { userId: user1.id, wordId: wordHello.id },
      { userId: user1.id, wordId: wordThankYou.id },
    ],
  });

  console.log(`✅ Đã tạo ${3} favorites`);

  // 5. Tạo Learning Session mẫu cho user1
  console.log('📖 Tạo learning session...');

  const session1 = await prisma.learningSession.create({
    data: {
      userId: user1.id,
      topicId: topicFood.id,
      totalWords: 5,
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 ngày trước
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000), // +10 phút
      status: 'completed',
    },
  });

  // 6. Tạo Learning Results
  console.log('📊 Tạo learning results...');

  await prisma.learningResult.createMany({
    data: [
      { sessionId: session1.id, wordId: wordApple.id, status: 'remembered' },
      { sessionId: session1.id, wordId: wordBanana.id, status: 'remembered' },
      { sessionId: session1.id, wordId: wordBread.id, status: 'uncertain' },
      { sessionId: session1.id, wordId: wordMilk.id, status: 'forgotten' },
      { sessionId: session1.id, wordId: wordWater.id, status: 'remembered' },
    ],
  });

  console.log(`✅ Đã tạo ${5} learning results`);

  // 7. Tạo Learning Progress
  console.log('📈 Tạo learning progress...');

  const now = new Date();
  const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await prisma.learningProgress.createMany({
    data: [
      {
        userId: user1.id,
        wordId: wordApple.id,
        status: 'remembered',
        reviewCount: 1,
        lastReviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        nextReviewAt: sevenDaysLater,
      },
      {
        userId: user1.id,
        wordId: wordBanana.id,
        status: 'remembered',
        reviewCount: 1,
        lastReviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        nextReviewAt: sevenDaysLater,
      },
      {
        userId: user1.id,
        wordId: wordBread.id,
        status: 'uncertain',
        reviewCount: 1,
        lastReviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        nextReviewAt: oneDayLater,
      },
      {
        userId: user1.id,
        wordId: wordMilk.id,
        status: 'forgotten',
        reviewCount: 1,
        lastReviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        nextReviewAt: now, // Cần ôn ngay
      },
      {
        userId: user1.id,
        wordId: wordWater.id,
        status: 'remembered',
        reviewCount: 1,
        lastReviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        nextReviewAt: sevenDaysLater,
      },
    ],
  });

  console.log(`✅ Đã tạo ${5} learning progress`);

  console.log('');
  console.log('🎉 Seed database hoàn thành!');
  console.log('');
  console.log('📊 Tổng kết:');
  console.log('   - Users: 3 (1 admin, 2 users)');
  console.log('   - Topics: 5');
  console.log('   - Words: 20');
  console.log('   - Examples: 20+');
  console.log('   - Favorites: 3');
  console.log('   - Learning Sessions: 1');
  console.log('   - Learning Results: 5');
  console.log('   - Learning Progress: 5');
  console.log('');
  console.log('🔑 Thông tin đăng nhập:');
  console.log('   Admin: admin@flashcard.com / 123456');
  console.log('   User1: thuan@example.com / 123456');
  console.log('   User2: mai@example.com / 123456');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
