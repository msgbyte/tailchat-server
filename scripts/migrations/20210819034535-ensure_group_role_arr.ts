import type { Db, MongoClient } from 'mongodb';

module.exports = {
  async up(db: Db, client: MongoClient) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});

    const collection = db.collection('groups');

    const list = await collection
      .find({
        members: {
          $elemMatch: {
            role: {
              $not: {
                $type: 'array',
              },
            },
          },
        },
      })
      .toArray();

    console.log(`待处理记录: ${list.length} 条`);

    for (const item of list) {
      item.members.forEach((member: any) => {
        if (!member.role) {
          return;
        }
        if (typeof member.role === 'string') {
          member.role = [member.role];
        }
      });

      const res = await collection.updateOne(
        {
          _id: item._id,
        },
        {
          $set: {
            members: item.members,
          },
        }
      );
      console.log('res:', res);
    }

    console.log(`更新了 ${list.length} 条记录`);
  },

  async down(db: Db, client: MongoClient) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  },
};
