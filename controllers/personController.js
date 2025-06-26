const personSchema = require('../utils/validatePerson');
const Person = require('../models/Person');
const { v4: uuidv4 } = require('uuid');
const PendingPersonUpdateSchema = require('../models/PendingPersonUpdateSchema');

// Create person info (All roles)
const createPersonInfo = async (req, res) => {
  const { error } = personSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  try {

    const userId = req.body.userId || uuidv4();
    const ifPersonExistWithId = await Person.findOne({ userId });
    if (ifPersonExistWithId) return res.status(400).json({ error: 'Already exist with same user id' });
    const person = new Person({ ...req.body, createdBy: req.user.id, userId });
    await person.save();

    res.json([{ messageKey: 'Success', message: 'Profile creation requested to admin successfully' }, person]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save person info' });
  }
};

// Approve profile (Admin only)
const approveProfile = async (req, res) => {
  try {
    const personalUniqueId = uuidv4();
    const profileData = await Person.findById(req.body.id);
    if (profileData.profileApprovedByAdmin == true) {
      return res.status(404).json({ error: 'This profile has already been approved.' });
    }
    const person = await Person.findByIdAndUpdate(req.body.id, { profileApprovedByAdmin: true, personalUniqueId }, { new: true });
    if (!person) return res.status(404).json({ error: 'Person not found' });
    res.json([{ messageKey: 'Success', message: 'Profile approved successfully' }, person]);
  } catch (err) {
    res.status(500).json({ error: 'Approval failed' });
  }
}

// Get list of all the persons
// const getPersonsList = async (req, res) => {
//   try {
//       if (req.user.role === 'R3') {
//         const people = await Person.find({ userId: req.user.id });
//         res.json(people);
//       } else {
//         const people = await Person.find();
//         res.json(people);
//       }
//     } catch (err) {
//       res.status(500).json({ error: 'Fetching persons failed' });
//     }
// };
const getPersonsList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // default to page 1
    const limit = parseInt(req.query.limit) || 10; // default 10 items per page
    const skip = (page - 1) * limit;

    const filter = req.user.role === 'R3'
      ? { userId: req.user.id }
      : {};

    const totalRecords = await Person.countDocuments(filter);
    const people = await Person.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // optional: sort by latest created

    res.json({
      page,
      limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      data: people
    });
  } catch (err) {
    res.status(500).json({ error: 'Fetching persons failed' });
  }
};

// Search persons
// const searchPersons = async (req, res) => {
//   try {
//     const filter = { ...req.body };
//     const people = await Person.find(filter);

//     if (people?.length) {
//       res.json(people);
//     } else {
//       res.status(404).json({ error: 'No matching persons found' });
//     }
//   } catch (err) {
//     res.status(500).json({ error: 'Search failed' });
//   }
// };
const searchPersons = async (req, res) => {
  try {
    const filter = {};

    for (const [key, value] of Object.entries(req.query)) {
      if (key.startsWith('age_')) {
        if (!filter.age) filter.age = {};

        if (key === 'age_gt') filter.age.$gt = Number(value);
        if (key === 'age_gte') filter.age.$gte = Number(value);
        if (key === 'age_lt') filter.age.$lt = Number(value);
        if (key === 'age_lte') filter.age.$lte = Number(value);
      }
      // Support nested address fields like address.city or address.state
      else if (key.startsWith('address.')) {
        filter[key] = value;
      }
      // Handle exact matches for other fields
      else {
        filter[key] = value;
      }
    }

    const people = await Person.find(filter);

    if (people?.length) {
      res.json(people);
    } else {
      res.status(404).json({ error: 'No matching persons found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
};

// Update person info (All roles)
// const updatePersonInfo = async (req, res) => {
//     const { error } = personSchema.validate(req.body);
//       if (error) return res.status(400).json({ error: error.details[0].message });
//       try {
//         if (req.user.role === 'R3') {
//           const p = await Person.findById(req.query.id);
//           if (p.userId !== req.user.id) {
//             return res.status(403).json({ error: 'You can only update your own profile' });
//           }
//         }
//         const person = await Person.findByIdAndUpdate(req.query.id, { ...req.body, updateApprovalPending: true }, { new: true });
//         if (!person) return res.status(404).json({ error: 'Person not found' });
//         res.json([{messageKey: 'Success', message: 'Profile update requested successfully'}, person]);
//       } catch (err) {
//         res.status(500).json({ error: 'Update failed' });
//       }
// }
const updatePersonInfo = async (req, res) => {
  const { error } = personSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const person = await Person.findById(req.query.id);
    if (!person) return res.status(404).json({ error: 'Person not found' });

    // Access User can update only their profile
    if (req.user.role === 'R3') {
      const p = await Person.findById(req.query.id);
      if (p.userId !== req.user.id) {
        return res.status(403).json({ error: 'You can only update your own profile' });
      }
    }

    // Check if the person is already approved
    if (!person.profileApprovedByAdmin) {
      return res.status(401).json({ error: 'Profile is not approved by admin yet. Please wait for approval before updating.' });
    }

    // Check if a pending update already exists
    const existingPending = await PendingPersonUpdateSchema.findOne({
      personId: req.query.id,
      status: 'Pending'
    });

    if (existingPending) {
      return res.status(409).json({
        error: 'An update request for this profile is already pending admin approval. Please wait for it to be processed before submitting a new request.'
      });
    }

    // Save the update request in PendingPersonUpdateSchema collection
    const pendingUpdate = new PendingPersonUpdateSchema({
      personId: person._id,
      requestedBy: req.user.id,
      oldData: person.toObject(),
      newData: req.body,
      status: 'Pending'
    });

    await pendingUpdate.save();
    await Person.findByIdAndUpdate(req.query.id, { updateApprovalPending: true });

    res.json([{ messageKey: 'Success', message: 'Profile update request submitted for admin approval' }, pendingUpdate]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit update request' });
  }
};

// Approve person info update (Admin only)
// const approveUpdate = async (req, res) => {
//     try {
//         const person = await Person.findByIdAndUpdate(req.body.id, { updateApprovalPending: false });
//         if (!person) return res.status(404).json({ error: 'Person not found' });
//         res.json([{messageKey: 'Success', message: 'Profile updation approved successfully'}, person]);
//       } catch (err) {
//         res.status(500).json({ error: 'Approval failed' });
//       }
// }
const approveUpdate = async (req, res) => {
  try {
    const { updateId } = req.body;
    const updateRequest = await PendingPersonUpdateSchema.findOne({ personId: updateId });
    if (!updateRequest || updateRequest.status !== 'Pending') {
      return res.status(404).json({ error: 'Pending update not found or already processed' });
    }
    
    // Apply the update to the Person record
    await Person.findByIdAndUpdate(updateRequest.personId, {...updateRequest.newData, updateApprovalPending: false});

    // Mark this update request as approved
    updateRequest.status = 'Approved';
    updateRequest.reviewedAt = new Date();
    updateRequest.reviewedBy = req.user.userId;

    await updateRequest.save();
    res.json({ message: 'Update approved and applied successfully', approvedUpdate: updateRequest });

  } catch (err) {
    res.status(500).json({ error: 'Approval failed', err });
  }
}

// Reject person info update (Admin only)
const rejectUpdate = async (req, res) => {
  try {
    const { updateId, rejectionReason } = req.body;
    // const { updateId } = req.body;
    const updateRequest = await PendingPersonUpdateSchema.findOne({ personId: updateId });
    if (!updateRequest || updateRequest.status !== 'Pending') {
      return res.status(404).json({ error: 'Pending update not found or already processed' });
    }

    // Apply the update to the Person record
    await Person.findByIdAndUpdate(updateRequest.personId, {...updateRequest.newData, updateApprovalPending: false});

    updateRequest.status = 'Rejected';
    updateRequest.reviewedAt = new Date();
    updateRequest.reviewedBy = req.user.id;
    updateRequest.rejectionReason = rejectionReason || 'No reason provided';

    await updateRequest.save();

    res.json({
      message: 'Update rejected successfully',
      rejectedUpdate: updateRequest
    });
  } catch (err) {
    console.error('Rejection Error:', err);
    res.status(500).json({ error: 'Rejection failed', details: err.message });
  }
};


// view access user profile
const viewAccessUserProfile = async (req, res) => {
  try {
    const person = await Person.findOne({ userId: req.user.id });
    if (!person) {
      return res.status(404).json({ error: 'Person profile not found for given user' });
    }
    res.json(person);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve person info' });
  }
};

module.exports = {
  searchPersons,
  getPersonsList,
  approveUpdate,
  updatePersonInfo,
  approveUpdate,
  createPersonInfo,
  approveProfile,
  viewAccessUserProfile,
  rejectUpdate
};