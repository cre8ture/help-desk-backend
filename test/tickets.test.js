const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../index'); // Update with the path to your Express app

chai.use(chaiHttp);
chai.should();

let ticketId;

beforeEach((done) => {
  chai.request(app)
    .post('/tickets')
    .send({
      name: "John Doe",
      email: "john@example.com",
      description: "Issue with product"
    })
    .end((err, res) => {
      ticketId = res.body.insertId; // Assuming your POST /tickets route returns the ID of the created ticket
      done();
    });
});



describe("Tickets API", () => {
    describe("POST /tickets", () => {
        it("should post a new ticket", (done) => {
            chai.request(app)
                .post('/tickets')
                .send({
                    name: "John Doe",
                    email: "john@example.com",
                    description: "Issue with product",
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').eql('Ticket received');
                    done();
                });
        });
    });

    describe("GET /tickets", () => {
        it("should get all tickets", (done) => {
            chai.request(app)
                .get('/tickets')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    done();
                });
        });
    });

    describe("PUT /tickets/:id", () => {
        it("should update a ticket given the id", (done) => {
          chai.request(app)
            .put('/tickets/' + ticketId)
            .send({
              name: "Jane Doe",
              email: "jane@example.com",
              description: "Updated issue description",
              status: "in progress"
            })
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('object');
              res.body.should.have.property('message').eql('Ticket updated successfully');
              done();
            });
        });
      });
      describe("DELETE /tickets/:id", () => {
        it("should delete a ticket given the id", (done) => {
          chai.request(app)
            .delete('/tickets/' + ticketId)
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('object');
              res.body.should.have.property('message').eql('Ticket deleted successfully');
              done();
            });
        });
      });
      
});
