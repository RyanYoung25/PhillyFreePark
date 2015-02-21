#!/usr/bin/env python
import MySQLdb

class DbHandler:

    def __init__():
        self.table_insert = "INSERT INTO parking(FIRST_NAME,LAST_NAME, AGE, SEX, INCOME) VALUES, (%.10f, %.10f, %.10f, %.10f, %.10f, %.10f, '%s', %.2f, %d)"
        self.db = MySQLdb.connect(host="localhost",
                                  user="root",
                                  passwd="",
                                  db="parking")
        self.cur = db.cursor()
        self.ids = []

    def execute(self, sql):
        try:
            cursor.execute(sql)
            self.db.commit()
            return True
        except:
            self.db.rollback()
            return False

    def insert(self, startLat, startLon, endLat, endLon, startCross, endCross, category, price, verified, duration):
        sql = self.table_insert.format(startLat, startLon, endLat, endLon, startCross, endCross, category, price, verified, duration)
        return self.execute(sql)

    def close(self):
        self.db.close()

if __name__ == '__main__':
    db = DbHandler()