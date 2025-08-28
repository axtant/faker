const prisma = require('../services/prismaClient');

exports.getUserProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { friends: true }
    });
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.grantFriendsAccess = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { friendsListAccess: true },
    });
    res.status(200).json({ message: 'Access granted' });
  } catch (err) {
    console.error('Error in grantFriendsAccess:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getFriendsList = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        friends: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            profileUrl: true,
            friendSince: true,
          },
        },
      },
    });

    res.json(user?.friends || []);
  } catch (err) {
    console.error('Error fetching friends list:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
