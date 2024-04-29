# Dynamodb

### Global Secondary Indexes (GSI) and Local Secondary Indexes (LSI)

- GSI and LSI are indexes that you can create on your DynamoDB tables to improve the speed of queries.
  - LSI: An index that has the same partition key as the table, but a different sort key.
  - GSI: An index with a partition key and an optional sort key that is different from those on the table.

### BatchWriteItems vs TransactWriteItems

- `BatchWriteItems` operation puts or deletes multiple items in one or more tables. It can't update items.
- `TransactWriteItems` operation puts, updates or deletes multiple items in one or more tables in a single, all-or-nothing operation.
