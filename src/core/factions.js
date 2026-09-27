/**
 *
 * @flow
 */

import Sequelize from 'sequelize';
import { Faction, RegUser } from '../data/models';

export function isMemberOfFaction(faction, user) {
  // KORUMA: Faction nesnesi boş gelirse sunucunun çökmesini engelle
  if (!faction || typeof faction.hasUser !== 'function') {
    return false;
  }

  return faction.hasUser(user, {
    where: {
      '$UserFactions.banned$': false,
    },
    joinTableAttributes: ['banned'],
  });
}

class Factions {
  factions: Array;
  factionInfo: Array;
  factionBans: Array;

  constructor() {
    this.updateFactions = this.updateFactions.bind(this);
    this.updateFactionInfo = this.updateFactionInfo.bind(this);
    this.updateBans = this.updateBans.bind(this);
    this.update = this.update.bind(this);

    this.factions = [];
    this.factionInfo = [];
    this.factionBans = [];
  }

  async update() {
    await this.updateFactions();
    await this.updateFactionInfo();
  }

  // eslint-disable-next-line class-methods-use-this
  async updateBans() {
    try {
      const dbBans = await Faction.findAll({
        attributes: ['id'],
        include: [
          {
            model: RegUser,
            attributes: ['id', 'name'],
            through: {
              attributes: [],
              where: {
                banned: true,
              },
            },
          },
        ],
      });

      this.factionBans = dbBans || [];
    } catch (err) {
      console.error('updateBans hatasi:', err);
      this.factionBans = [];
    }
  }

  async updateFactions() {
    try {
      const dbFactions = await Faction.findAll({
        attributes: [
          'id',
          'name',
          [Sequelize.col('Users.name'), 'leader'],
          'icon',
        ],
        where: {
          private: false,
          '$Users.id$': {
            [Sequelize.Op.eq]: Sequelize.col('Faction.leader'),
          },
        },
        include: [
          {
            model: RegUser,
            attributes: [],
          },
        ],
        order: ['name'],
      });

      this.factions = dbFactions || [];
    } catch (err) {
      console.error('updateFactions hatasi:', err);
      this.factions = [];
    }
  }

  async updateFactionInfo() {
    try {
      const dbFactions = await Faction.findAll({
        attributes: [
          'id',
          'name',
          ['leader', 'leaderId'],
          'icon',
          'private',
          'invite',
        ],
        include: [
          {
            model: RegUser,
            attributes: ['name', 'id'],
            through: {
              attributes: ['admin'],
              where: {
                banned: false,
              },
            },
          },
        ],
      });

      // KORUMA: Undefined/null kayıtları temizle ve güvenli dönüştür
      this.factionInfo = (dbFactions || [])
        .filter((faction) => faction != null)
        .map((faction) => (typeof faction.toJSON === 'function' ? faction.toJSON() : faction));
    } catch (err) {
      console.error('updateFactionInfo hatasi:', err);
      this.factionInfo = [];
    }
  }
}

const factions = new Factions();

export default factions;
