const User = require('../models/User');

// @desc    Get user profile details
// @route   GET /api/v1/users/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          preferences: user.preferences,
          createdAt: user.createdAt,
        },
      });
    } else {
      res.status(404);
      throw new Error('User account not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile & preferences
// @route   PUT /api/v1/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      
      if (req.body.preferences) {
        user.preferences.language = req.body.preferences.language || user.preferences.language;
        user.preferences.theme = req.body.preferences.theme || user.preferences.theme;
      }

      const updatedUser = await user.save();

      res.status(200).json({
        success: true,
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          preferences: updatedUser.preferences,
        },
      });
    } else {
      res.status(404);
      throw new Error('User account not found');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
