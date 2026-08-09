import { asyncHandler } from "../../../utils/res/error.res.js";
import * as dbService from "../../../DB/db.service.js";
import { userModel } from "../../../DB/models/User.model.js";
import { success } from "../../../utils/res/success.res.js";
import { cloud } from "../../../utils/multer/cloudinary.js";

export const porfile = asyncHandler(async (req, res, next) => {
  const {
    user: { _id, name, friends, image },
  } = req;
  res.json({
    message: "user profile data ",
    user: { _id, name, image, friends },
  });
});

export const getUser = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { userId } = req.params;

  const theUser = await dbService.findOne({
    model: userModel,
    filter: { _id: userId, isDeleted: { $exists: false }, isConfirmed: true },
  });
  if (!theUser) return next(new Error("You can't see this profile", { cause: 404 }));
  if (theUser?.blockedUsers?.some((id) => id.toString() === user._id.toString())) {
    return next(new Error("You Can't see this user profile", { cause: 400 }));
  }
  const { name, gender, image, coverImage } = theUser;
  // console.log(theUser);

  success({
    res,
    data: { user: { _id, name, image } },
  });
});
export const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await dbService.findAll({
    model: userModel,
    filter: {
      isDeleted: { $exists: false },
      isConfirmed: true,
      _id: { $nin: [...(req.user.blockedUsers || []), req.user._id] },
      blockedUsers: { $ne: req.user._id },
    },
    select: " name image _id ",
    // populate: ["chatsAsMain", "chatsAsSub"],
  });

  success({
    res,
    data: { users },
  });
});

export const addFriend = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { friendId } = req.params;

  const friend = await dbService.findOne({
    model: userModel,
    filter: { _id: friendId, isDeleted: { $exists: false }, isConfirmed: true },
  });

  if (user._id.toString() === friendId) {
    throw new Error("Cannot add yourself as friend", { cause: 400 });
  }
  if (!friend) next(new Error("Friend not found", { cause: 404 }));
  if (
    user.friends.find(
      (friend) =>
        friend.user.toString() === friendId && friend.state === "accepted"
    )
  ) {
    next(new Error("You are already friends", { cause: 400 }));
  }
  const friendInTheList = user.friends.find(
    (friend) =>
      friend.user.toString() === friendId && friend.state === "pending"
  );
  if (friendInTheList) {
    friendInTheList.state = "accepted";
    await user.save();
    await dbService.updateOne({
      model: userModel,
      filter: { _id: friend._id },
      data: {
        $addToSet: { friends: { user: user._id, state: "accepted" } },
      },
    });
  } else {
    await dbService.updateOne({
      model: userModel,
      filter: { _id: friend._id },
      data: {
        $push: { friends: { user: user._id, state: "pending" } },
      },
    });
  }

  success({
    res,
    data: { message: "The request has been sent successfully", user, friend },
  });
});

export const acceptRequest = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { friendId } = req.params;

  const friend = await dbService.findOne({
    model: userModel,
    filter: { _id: friendId, isDeleted: { $exists: false }, isConfirmed: true },
  });

  if (!friend) next(new Error("Friend not found", { cause: 404 }));

  const friendInTheList = user.friends.find(
    (friend) => friend.user.toString() === friendId
  );
  friendInTheList.state = "accepted";
  await user.save();

  await dbService.updateOne({
    model: userModel,
    filter: { _id: friend._id },
    data: {
      $addToSet: { friends: { user: user._id, state: "accepted" } },
    },
  });

  return success({
    res,
    data: { message: "The request has been accepted successfully" },
  });
});

export const removeFriend = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { friendId } = req.params;
  const friend = await dbService.findOne({
    model: userModel,
    filter: { _id: friendId, isDeleted: { $exists: false }, isConfirmed: true },
  });

  //   check if the friendId is valid
  if (!friend) next(new Error("Friend not found", { cause: 404 }));

  // check if the friendId equal to the user id
  if (friend._id.toString() === user._id.toString())
    next(new Error("You can't remove yourself", { cause: 400 }));

  // check if the user is a friend
  if (!user.friends.find((friend) => friend.user.toString() === friendId)) {
    next(new Error("You are not friends", { cause: 400 }));
  }

  // remove the friend from the user's friends list and the user from that friend's  list
  await dbService.updateOne({
    model: userModel,
    filter: { _id: user._id },
    data: {
      $pull: { friends: { user: friend._id } },
    },
  });
  await dbService.updateOne({
    model: userModel,
    filter: { _id: friend._id },
    data: {
      $pull: { friends: { user: user._id } },
    },
  });
  return success({
    res,
    data: { message: "The friend has been removed successfully" },
  });
});

export const blockUser = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { friendId } = req.params;
  const friend = await dbService.findOne({
    model: userModel,
    filter: { _id: friendId, isDeleted: { $exists: false }, isConfirmed: true },
  });

  if (!friend) next(new Error("Friend not found", { cause: 404 }));

  if (friend._id.toString() === user._id.toString()) {
    next(new Error("You can't block yourself", { cause: 400 }));
  }

  await dbService.updateOne({
    model: userModel,
    filter: { _id: user._id },
    data: {
      $pull: { friends: { user: friend._id } }, // remove the friend from the user's friends list
      $addToSet: { blockedUsers: friend._id }, //  add the friend to the user's blocked users list
    },
  });
  return success({
    res,
    data: { message: "The user has been blocked successfully" },
  });
});

export const updateImageCloud = asyncHandler(async (req, res, next) => {
  const { secure_url, public_id } = await (
    await cloud()
  ).uploader.upload(req.file.path, {
    folder: "user/personalImage",
  });

  if (req.user.image?.public_id) {
    await (await cloud()).uploader.destroy(req.user.image.public_id);
  }
  await dbService.updateOne({
    model: userModel,
    filter: { _id: req.user._id },
    data: { image: { secure_url, public_id } },
  });
  return success({
    res,
    statusCode: 201,
    data: { message: "Image updated successfully" },
  });
});
